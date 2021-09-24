import webpack from 'webpack';
import { spawn } from 'child_process';

interface Command {
    command: string;
    args: string[];
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
            const execute = ({ command, args }: Command) =>
                spawn(command, args, { stdio: 'inherit', cwd: this.options.cwd });

            if (!this.initialRun) {
                this.initialRun = true;
                this.options.runAfterBuild?.forEach(execute);
            }
        });
    }
}

export default ShellSpawnPlugin;
