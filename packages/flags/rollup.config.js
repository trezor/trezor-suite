
import babel from 'rollup-plugin-babel';
import cleanup from 'rollup-plugin-cleanup';

export default {
    input: 'src/main.js',
    output: {
        file: 'lib/trezor-flags.js',
        format: 'cjs',
    },
    plugins: [
        babel(),
        cleanup(),
    ],
};
