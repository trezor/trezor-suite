import path from 'path';
import { spawn } from 'child_process';

const customTorProcessDir = process.env.TOR_BINARY_PATH;
const processDir = path.join(__dirname, './../../suite-data/files/bin/tor/linux-x64/');
const processPath = customTorProcessDir || path.join(processDir, 'tor');

export const torRunner = ({ torParams = [] }: { torParams: string[] }) => {
    const process = spawn(processPath, torParams, {
        cwd: processDir,
        stdio: ['ignore', 'ignore', 'ignore'],
    });

    return process;
};
