import webpack from 'webpack';
import { exec } from 'child_process';

interface Options {
    cwd?: string;
    runAfterBuild?: string[];
    runAfterWatch?: string[];
}

const defaultOptions: Options = {
    runAfterBuild: [],
    runAfterWatch: [],
};

class ShellExecPlugin {
    initialRun = false;
    options: Options;

    constructor(options: Options) {
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.afterEmit.tap('ShellExecPlugin', (_: webpack.Compilation) => {
            if (!this.initialRun) {
                this.initialRun = true;

                this.options.runAfterBuild?.forEach(cmd => {
                    exec(cmd, { cwd: this.options.cwd });
                });
            } else {
                this.options.runAfterWatch?.forEach(cmd => {
                    exec(cmd, { cwd: this.options.cwd });
                });
            }
        });
    }
}

export default ShellExecPlugin;
