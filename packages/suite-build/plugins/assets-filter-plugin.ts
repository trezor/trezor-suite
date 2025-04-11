import webpack from 'webpack';

// manage included Assets
export class AssetsFilterPlugin {
    name = 'AssetsFilterPlugin';
    initialRun = false;
    patterns: RegExp[];

    constructor(options: { test: RegExp[] }) {
        this.patterns = options.test || [];
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.thisCompilation.tap(this.name, compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: this.name,
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                () => {
                    if (!this.initialRun) {
                        this.initialRun = true;

                        const assets = compilation.getAssets().map(a => a.name);
                        const removed: string[] = [];
                        for (const filename of assets) {
                            if (this.patterns.some(pattern => pattern.test(filename))) {
                                removed.push(filename);
                                compilation.deleteAsset(filename);
                            }
                        }

                        if (removed.length > 0) {
                            console.log(` files removed from compilation: ${removed.join(', ')}`);
                        } else {
                            console.log(` no files removed from compilation`);
                        }
                    }
                },
            );
        });
    }
}
