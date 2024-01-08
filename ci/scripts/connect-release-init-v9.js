/* eslint-disable camelcase */

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const { exec } = require('./helpers');

const ROOT = path.join(__dirname, '..', '..');

const init = () => {
    const PACKAGE_PATH = path.join(ROOT, 'packages', 'connect');
    const PACKAGE_JSON_PATH = path.join(PACKAGE_PATH, 'package.json');
    const rawPackageJSON = fs.readFileSync(PACKAGE_JSON_PATH);
    const packageJSON = JSON.parse(rawPackageJSON);
    const { version } = packageJSON;

    // Version should have been bumped by now thanks to ./ci/scripts/connect-release-init-npm.js
    const branchName = `release/connect/${version}`;

    exec('git', ['checkout', '-b', branchName]);

    exec('git', ['push', 'origin', branchName]);
};

init();
