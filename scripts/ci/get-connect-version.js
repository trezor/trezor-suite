/* eslint-disable camelcase */

import path from 'node:path';
import fs from 'node:fs';
import { getDirname } from './helpers';

const ROOT = path.join(getDirname(import.meta.url), '..', '..');

const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
const packageJSON = JSON.parse(rawPackageJSON);
const { version } = packageJSON;

process.stdout.write(version);
