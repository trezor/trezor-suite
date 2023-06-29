import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const customTorProcessDir = process.env.TOR_BINARY_PATH;
const processDir = path.join(__dirname, './../../suite-data/files/bin/tor/linux-x64/');
const processPath = customTorProcessDir || path.join(processDir, 'tor');

function checkFileExists(filePath: string) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

export const torRunner = ({ torParams = [] }: { torParams: string[] }) => {
    console.log('torRunner', processPath, torParams);

    const fileExists = checkFileExists(processPath);
    console.log(`File ${processPath} exists: ${fileExists}`);
    const process = spawn(processPath, torParams, {
        cwd: processDir,
        stdio: ['ignore', 'ignore', 'ignore'],
    });
    console.log('process', process);
    return process;
};
