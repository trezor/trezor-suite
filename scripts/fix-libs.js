/**
 * This is a utility that is useful for users of Webstorm. It's auto-import adds
 * a `/libDev/src` a lot, and it's annoying to fix it manually.
 *
 * This may be used in as the `File Watchers` script to on-save fix the file automatically.
 */
import fs from 'fs';

const file = process.argv[2];
let text = fs.readFileSync(file, 'utf8');

text = text.replace("/libDev/src';\n", "';\n");

fs.writeFileSync(file, text);
