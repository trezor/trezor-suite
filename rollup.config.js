
import babel from 'rollup-plugin-babel';

export default {
    input: 'src/main.js',
    output: {
        file: 'lib/trezor-update.js',
        format: 'cjs',
    },
    plugins: [
        babel(),
    ],
};
