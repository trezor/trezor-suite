module.exports = {
    jsc: {
        parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
        },
        transform: {
            react: {
                runtime: 'automatic',
            },
            decoratorVersion: '2022-03',
        },
        target: 'esnext',
    },
    module: {
        type: 'commonjs',
    },
};
