/* eslint-disable camelcase */

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');

const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
const packageJSON = JSON.parse(rawPackageJSON);
const { version } = packageJSON;

process.stdout.write(version);
