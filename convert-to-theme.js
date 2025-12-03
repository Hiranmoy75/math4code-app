#!/usr/bin/env node

/**
 * Script to convert React Native screens to use dynamic theming
 * This moves StyleSheet.create inside components to access useAppTheme hook
 */

const fs = require('fs');
const path = require('path');

const screensToConvert = [
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/DashboardScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/ProfileScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/NotificationsScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/EditProfileScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/HelpSupportScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/CourseDetailsScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/LibraryScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/CoursesScreen.tsx',
    'e:/PROJECT 2025 - October/math4code-app/src/screens/student/ExamsScreen.tsx',
];

function convertScreenToTheme(filePath) {
    console.log(`Converting: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Find the styles definition
    const stylesMatch = content.match(/const styles = StyleSheet\.create\({[\s\S]*?\n}\);/);

    if (!stylesMatch) {
        console.log(`  ⚠️  No styles found in ${filePath}`);
        return;
    }

    const stylesCode = stylesMatch[0];

    // Find the component function
    const componentMatch = content.match(/(export const \w+Screen = \(\) => {[\s\S]*?)(const styles = StyleSheet\.create)/);

    if (!componentMatch) {
        console.log(`  ⚠️  Could not find component pattern in ${filePath}`);
        return;
    }

    // Remove the styles from the end
    content = content.replace(/\nconst styles = StyleSheet\.create\({[\s\S]*?\n}\);[\s\S]*$/, '\n');

    // Find where to insert styles (after hooks, before return)
    const returnMatch = content.match(/(const { colors, shadows } = useAppTheme\(\);[\s\S]*?)(return \()/);

    if (!returnMatch) {
        console.log(`  ⚠️  Could not find insertion point in ${filePath}`);
        return;
    }

    // Insert styles before return
    content = content.replace(
        /(const { colors, shadows } = useAppTheme\(\);[\s\S]*?)(return \()/,
        `$1\n    ${stylesCode}\n\n    $2`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Converted ${path.basename(filePath)}`);
}

// Run conversion
screensToConvert.forEach(convertScreenToTheme);

console.log('\n✅ All screens converted!');
