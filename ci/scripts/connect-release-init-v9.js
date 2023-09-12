/* eslint-disable camelcase */

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const { checkPackageDependencies, exec, commit, comment } = require('./helpers');

const ROOT = path.join(__dirname, '..', '..');

const init = () => {
    const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
    const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
    const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
    const packageJSON = JSON.parse(preBumpRawPackageJSON);
    const { version } = packageJSON;

    const branchName = `release/connect/${version}`;

    exec('git', ['checkout', '-b', branchName]);

    exec('git', ['push', 'origin', branchName]);
};

init();
