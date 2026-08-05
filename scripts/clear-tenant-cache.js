#!/usr/bin/env node

/**
 * Clear Tenant Cache Script
 * 
 * This script clears all caches when switching tenant IDs:
 * 1. Metro bundler cache
 * 2. Expo cache
 * 3. Node modules cache
 * 
 * After running this, you should also clear AsyncStorage in the app
 * or reinstall the app to ensure Supabase session is cleared.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing Tenant Cache...\n');

// Directories to remove
const cacheDirs = [
    '.expo',
    'node_modules/.cache',
    '.metro-cache'
];

// Remove cache directories
cacheDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ Removing ${dir}...`);
        fs.rmSync(dirPath, { recursive: true, force: true });
    } else {
        console.log(`⏭️  ${dir} not found, skipping...`);
    }
});

// Clear npm cache
console.log('\n📦 Clearing npm cache...');
try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ npm cache cleared');
} catch (error) {
    console.error('❌ Failed to clear npm cache:', error.message);
}

console.log('\n✨ Cache cleared successfully!');
console.log('\n⚠️  IMPORTANT: You must also clear AsyncStorage in the app:');
console.log('   1. Uninstall and reinstall the app, OR');
console.log('   2. Add a temporary button to clear AsyncStorage.clear()');
console.log('\n🚀 Now run: npm start -- --clear');
