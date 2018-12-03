
import babel from 'rollup-plugin-babel';
import includePaths from 'rollup-plugin-includepaths';

export default {
    input: 'src/index.js',
    output: {
        file: 'lib/trezor-update.js',
        format: 'cjs',
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
        }),
        includePaths({
            paths: ['src'],
            extensions: ['.js', '.json'],
        }),
    ],
};
