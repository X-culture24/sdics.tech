#!/bin/bash

# Build SDICS Mobile APK
# Prerequisites:
# - Node.js 18+
# - npm
# - Java 11+
# - Android SDK
# - Android Studio (recommended for APK signing)

set -e

echo "=== SDICS Mobile APK Build ==="
echo "Timestamp: $(date)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo ""
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js not found${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm not found${NC}"; exit 1; }
command -v java >/dev/null 2>&1 || { echo -e "${RED}Java not found${NC}"; exit 1; }

echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
echo -e "${GREEN}✓ Java: $(java -version 2>&1 | head -1)${NC}"

# Navigate to mobile directory
cd "$(dirname "$0")/../frontend-mobile"

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Building web assets..."
npm run build

echo ""
echo "Setting up Capacitor for Android..."
# Check if android directory exists
if [ ! -d "android" ]; then
    echo "Initializing Android project..."
    npx cap add android
else
    echo "Android project already exists, syncing..."
fi

echo "Syncing Capacitor..."
npm run capacitor:sync

echo ""
echo -e "${YELLOW}⚠️  APK Building Options:${NC}"
echo ""
echo "Option 1: Debug APK (unsigned, for testing)"
echo "  Command: npm run apk:debug"
echo "  Output: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Option 2: Release APK (requires signing, for production)"
echo "  Command: npm run apk:release"
echo "  Output: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Option 3: Manual build in Android Studio"
echo "  Command: npm run capacitor:open:android"
echo "  Then build from Android Studio"
echo ""
echo -e "${YELLOW}Building debug APK...${NC}"
npm run apk:debug

echo ""
echo -e "${GREEN}=== Build Complete ===${NC}"
echo ""
echo "Debug APK location: frontend-mobile/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To distribute the APK:"
echo "  1. Copy app-debug.apk to a web server"
echo "  2. Share download link with testers"
echo "  3. Users can download and install directly"
echo ""
echo "For production release:"
echo "  1. Generate signing key: keytool -genkey -v -keystore sdics.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias sdics"
echo "  2. Configure gradle.properties with keystore path"
echo "  3. Run: npm run apk:release"
echo ""
