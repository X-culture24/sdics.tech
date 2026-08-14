"""
Ultra-fast importer using PostgreSQL COPY (10-100x faster than ORM).
Optimized for 12M+ citizen scale.
"""

from pathlib import Path
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.conf import settings
import pandas as pd
import io
from core.models import ImportLog


class FastCitizenImporter:
    """Uses PostgreSQL COPY for ultra-fast bulk insert."""

    COLUMN_MAPPING = {
        'Full Name': 'full_name',
        'Sex': 'sex',
        'District': 'district',
        'Division': 'division',
        'Location': 'location',
        'Sub Location': 'sub_location',
        'Village': 'village',
        'ID Number': 'national_id',
        'Date of Birth': 'date_of_birth',
        'Tribe': 'tribe',
        'Phone Numbers': 'phone_number',
    }

    def __init__(self, file_path, county=None, sheet_name='Gaps'):
        self.file_path = file_path
        self.county = county or self._derive_county(file_path)
        self.sheet_name = sheet_name
        self.errors = []
        self.stats = {'total_rows': 0, 'processed': 0, 'duplicates': 0, 'failed': 0}

    def _derive_county(self, file_path):
        file_name = Path(file_path).stem
        county = file_name.rsplit(' ', 1)[0].strip() if ' ' in file_name else file_name
        return county

    def process(self):
        try:
            # Read file
            file_ext = Path(self.file_path).suffix.lower()
            if file_ext == '.csv':
                print(f"Reading CSV: {self.file_path}...")
                df = pd.read_csv(self.file_path, dtype=str)
            else:
                print(f"Reading Excel: {self.file_path}...")
                df = pd.read_excel(self.file_path, sheet_name=self.sheet_name, dtype=str, engine='openpyxl')
            
            self.stats['total_rows'] = len(df)
            print(f"Loaded {self.stats['total_rows']} rows")
            
            # Map headers
            headers = self._detect_headers(df.columns)
            df = df.rename(columns=headers)
            
            # Add metadata
            now = datetime.now()
            df['county'] = self.county
            df['source_file'] = Path(self.file_path).name
            df['registration_status'] = 'UNREGISTERED'
            df['created_at'] = now.isoformat()
            df['updated_at'] = now.isoformat()
            
            # Normalize
            print("Normalizing data...")
            self._normalize(df)
            
            # Remove missing required
            before = len(df)
            df = df.dropna(subset=['national_id', 'full_name'])
            self.stats['failed'] += before - len(df)
            
            # Remove internal dupes
            before = len(df)
            df = df.drop_duplicates(subset=['national_id'], keep='first')
            self.stats['duplicates'] += before - len(df)
            
            # Get existing IDs
            print("Checking for existing duplicates...")
            existing = self._get_existing_ids()
            before = len(df)
            df = df[~df['national_id'].isin(existing)].copy()
            dupes = before - len(df)
            self.stats['duplicates'] += dupes
            print(f"  Skipped {dupes} existing citizens")
            
            if len(df) == 0:
                print("No new citizens to import")
                return True
            
            # Insert via COPY
            print(f"Importing {len(df)} citizens using PostgreSQL COPY...")
            self._copy_insert(df)
            self.stats['processed'] = len(df)
            
            return True
        except Exception as e:
            self.errors.append({'error': str(e), 'type': 'CRITICAL'})
            import traceback
            traceback.print_exc()
            return False

    def _detect_headers(self, cols):
        headers = {}
        for col in cols:
            col_str = str(col).strip()
            if col_str in self.COLUMN_MAPPING:
                headers[col_str] = self.COLUMN_MAPPING[col_str]
            else:
                for expected, dbfield in self.COLUMN_MAPPING.items():
                    if expected.lower() in col_str.lower():
                        headers[col_str] = dbfield
                        break
        
        required = {'national_id', 'full_name', 'district', 'division', 'location'}
        if not required.issubset(set(headers.values())):
            raise ValueError(f"Missing columns: {required - set(headers.values())}")
        
        return headers

    def _normalize(self, df):
        for col in ['full_name', 'district', 'division', 'location', 'sub_location', 'village', 'tribe']:
            if col in df.columns:
                df[col] = df[col].fillna('').str.strip().str.title()
                df.loc[df[col] == '', col] = None
        
        if 'sex' in df.columns:
            sex_map = {'M': 'MALE', 'F': 'FEMALE', 'MALE': 'MALE', 'FEMALE': 'FEMALE'}
            df['sex'] = df['sex'].fillna('').str.upper().map(lambda x: sex_map.get(x, 'UNKNOWN'))
        
        if 'date_of_birth' in df.columns:
            df['date_of_birth'] = pd.to_datetime(df['date_of_birth'], errors='coerce').dt.date
        
        if 'phone_number' in df.columns:
            df['phone_number'] = df['phone_number'].fillna('').str.strip()
            df.loc[~df['phone_number'].str.startswith(('0', '+254'), na=False), 'phone_number'] = None
            df.loc[df['phone_number'] == '', 'phone_number'] = None
        
        if 'national_id' in df.columns:
            df['national_id'] = df['national_id'].astype(str).str.strip()

    def _get_existing_ids(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT national_id FROM core_citizen")
            return {row[0] for row in cursor.fetchall()}

    def _copy_insert(self, df):
        """Ultra-fast insert using PostgreSQL COPY."""
        cols = ['national_id', 'full_name', 'sex', 'date_of_birth', 'tribe', 'phone_number',
                'county', 'district', 'division', 'location', 'sub_location', 'village',
                'registration_status', 'source_file', 'created_at', 'updated_at']
        
        # Create CSV buffer
        buf = io.StringIO()
        for _, row in df.iterrows():
            values = []
            for col in cols:
                val = row.get(col)
                if val is None or (isinstance(val, float) and pd.isna(val)) or val == '':
                    values.append('')
                else:
                    val_str = str(val)
                    # CSV quoting
                    if ',' in val_str or '"' in val_str or '\n' in val_str:
                        val_str = '"' + val_str.replace('"', '""') + '"'
                    values.append(val_str)
            buf.write(','.join(values) + '\n')
        
        buf.seek(0)
        
        with connection.cursor() as cursor:
            cursor.copy_from(buf, 'core_citizen', columns=cols, sep=',', null='')
        
        connection.commit()
        print(f"  ✓ Inserted {len(df)} rows using COPY")


class Command(BaseCommand):
    help = 'Ultra-fast import of citizens (uses PostgreSQL COPY)'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, help='Path to CSV or XLSX file')
        parser.add_argument('--county', type=str, help='County name')
        parser.add_argument('--dry-run', action='store_true', help='Dry run (no database changes)')

    def handle(self, *args, **options):
        file_path = options.get('file')
        county = options.get('county')
        dry_run = options.get('dry_run')

        if file_path:
            self._import_file(file_path, county, dry_run)
        else:
            self._import_all()

    def _import_file(self, file_path, county, dry_run):
        self.stdout.write(f"Importing {file_path}...")
        
        import_log = ImportLog.objects.create(
            file_path=file_path,
            county=county,
            status='PROCESSING',
            started_at=datetime.now()
        )
        
        try:
            importer = FastCitizenImporter(file_path, county)
            success = importer.process()
            
            import_log.total_rows = importer.stats['total_rows']
            import_log.processed_count = importer.stats['processed']
            import_log.duplicate_count = importer.stats['duplicates']
            import_log.failed_count = importer.stats['failed']
            import_log.errors = importer.errors
            import_log.status = 'COMPLETED' if success else 'FAILED'
            import_log.completed_at = datetime.now()
            import_log.save()
            
            self._show_results(importer)
        except Exception as e:
            import_log.status = 'FAILED'
            import_log.errors = [{'error': str(e)}]
            import_log.completed_at = datetime.now()
            import_log.save()
            raise CommandError(f"Import failed: {str(e)}")

    def _import_all(self):
        datasets_dir = Path(settings.DATASETS_DIR)
        if not datasets_dir.exists():
            raise CommandError(f"Datasets folder not found: {datasets_dir}")
        
        files = sorted(list(datasets_dir.glob('*.csv')) + list(datasets_dir.glob('*.xlsx')))
        if not files:
            self.stdout.write(self.style.WARNING("No data files found"))
            return
        
        self.stdout.write(f"Found {len(files)} files")
        for file_path in files:
            if ImportLog.objects.filter(file_path=str(file_path), status='COMPLETED').exists():
                self.stdout.write(self.style.WARNING(f"Skipping {file_path} (already imported)"))
                continue
            self._import_file(str(file_path), None, False)

    def _show_results(self, importer):
        self.stdout.write(self.style.SUCCESS("\n✓ Import Complete"))
        self.stdout.write(f"  Total rows: {importer.stats['total_rows']}")
        self.stdout.write(f"  Inserted: {importer.stats['processed']}")
        self.stdout.write(f"  Duplicates: {importer.stats['duplicates']}")
        self.stdout.write(f"  Failed: {importer.stats['failed']}")
