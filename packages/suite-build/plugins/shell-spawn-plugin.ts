import { spawn, spawnSync } from 'child_process';
import webpack from 'webpack';

import { isWindows } from '@trezor/env-utils';

interface Command {
    command: string;
    args: string[];
    isSync?: boolean;
}

interface Options {
    cwd?: string;
    runAfterBuild?: Command[];
}

const defaultOptions: Options = {
    runAfterBuild: [],
};

class ShellSpawnPlugin {
    initialRun = false;
    options: Options;

    constructor(options: Options) {
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.afterEmit.tap('ShellSpawnPlugin', (_: webpack.Compilation) => {
            const execute = ({ command, args, isSync }: Command) => {
                if (isSync) {
                    return spawnSync(command, args, {
                        stdio: 'inherit',
                        cwd: this.options.cwd,
                        // on Unix systems, the compile process doesn't need direct shell access, as it recognizes `yarn` executable in PATH and can call it directly
                        // but it's a common issue on Windows that nodeJS can't access `yarn` and needs to use shell at CWD to run commands through it
                        shell: isWindows(),
                    });
                }

                return spawn(command, args, {
                    stdio: 'inherit',
                    cwd: this.options.cwd,
                    shell: isWindows(), // see spawnSync above
                });
            };

            if (!this.initialRun) {
                this.initialRun = true;
                this.options.runAfterBuild?.forEach(execute);
            }
        });
    }
}

export default ShellSpawnPlugin;
