import webpack from 'webpack';
import { spawnSync } from 'child_process';

interface Options {
    cwd: string;
    files: string[];
}

// Patch binaries which requires interpreter on NixOS dev build
export class NixosInterpreterPlugin {
    name = 'NixosInterpreterPlugin';
    initialRun = false;
    options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    getInterpreter() {
        const { output } = spawnSync('cat', [`${process.env.NIX_CC}/nix-support/dynamic-linker`], {
            stdio: 'pipe',
            encoding: 'utf-8',
            cwd: this.options.cwd,
        });

        return output.join('').replace(/(\r\n|\n|\r)/gm, '');
    }

    setInterpreter(interpreter: string, file: string) {
        return spawnSync(
            'patchelf',
            [
                '--set-rpath',
                `${process.env.NIX_PATCHELF_LIBRARY_PATH}`,
                '--set-interpreter',
                interpreter,
                file,
            ],
            {
                stdio: 'inherit',
                cwd: this.options.cwd,
            },
        );
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.afterEmit.tap(this.name, () => {
            if (!this.initialRun && process.env.NODE_ENV !== 'production' && process.env.NIX_CC) {
                console.log(`${this.name} patching: ${this.options.files.join(',')}`);
                this.initialRun = true;
                const interpreter = this.getInterpreter();
                this.options.files.forEach(file => this.setInterpreter(interpreter, file));
            } else {
                console.log(`${this.name} not used`);
            }
        });
    }
}
