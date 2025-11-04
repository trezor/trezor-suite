/* eslint-disable no-console */
import { exec } from 'node:child_process';
import path from 'node:path';
import { parentPort, threadId } from 'node:worker_threads';

const ROOT = process.cwd();
const ESLINT_BIN = path.resolve(ROOT, 'node_modules/eslint/bin/eslint.js');

async function runEslintFixForAllDirs(dirs) {
    console.log(threadId, `Fixing dirs:`, dirs.join(', '));

    for (const dir of dirs) {
        try {
            await new Promise((resolve, reject) =>
                exec(
                    `node ${ESLINT_BIN} --flag v10_config_lookup_from_file --no-error-on-unmatched-pattern ./${dir}/src --fix`,
                    {
                        stdio: 'inherit',
                    },
                    (error, stdout, stderr) => {
                        if (stderr) console.error(stderr);
                        if (stdout) console.log(stdout);

                        if (error) {
                            reject(error);
                        } else {
                            resolve(null);
                        }
                    },
                ),
            );
        } catch (error) {
            console.error(threadId, `Failed to fix ${dir}: ${error}`);
            parentPort.postMessage({ success: false, error: error.message });
        }
    }

    parentPort.postMessage({ success: true });
}

parentPort.on('message', runEslintFixForAllDirs);

parentPort.on('error', error => {
    console.error('Worker error:', error);
    process.exit(1);
});
