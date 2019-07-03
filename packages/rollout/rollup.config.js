import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';

export default {
    input: 'src/index.ts',
    output: {
        file: 'lib/trezor-rollout.js',
        format: 'cjs',
    },
    plugins: [babel(), typescript(), cleanup()],
};
