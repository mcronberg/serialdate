// Fails (exit code 1) if VERSION drifts between script.js, sw.js and the
// JSON-LD softwareVersion in index.html. Run via `node scripts/check-version-sync.js`.
// See CLAUDE.md / .github/copilot-instructions.md: "always bump VERSION in
// both script.js AND sw.js" - this check makes that convention enforceable,
// and also covers the JSON-LD copy that previously drifted out of sync.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readVersion(file, regex) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const match = content.match(regex);
    if (!match) {
        throw new Error(`Could not find a VERSION-like string in ${file}`);
    }
    return match[1];
}

const versions = {
    'script.js': readVersion('script.js', /const VERSION = '([\d.]+)'/),
    'sw.js': readVersion('sw.js', /const VERSION = '([\d.]+)'/),
    'index.html (JSON-LD softwareVersion)': readVersion('index.html', /"softwareVersion":\s*"([\d.]+)"/)
};

const uniqueVersions = new Set(Object.values(versions));

if (uniqueVersions.size > 1) {
    console.error('VERSION mismatch detected:');
    for (const [file, version] of Object.entries(versions)) {
        console.error(`  ${file}: ${version}`);
    }
    console.error('\nBump VERSION in script.js, sw.js and the softwareVersion field in index.html together.');
    process.exit(1);
}

console.log(`VERSION is in sync across all files: ${[...uniqueVersions][0]}`);
