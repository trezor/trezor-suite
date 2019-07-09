export const presets = ['@babel/preset-env'];
export const plugins = [
    [
        'module-resolver',
        {
            root: ['./src'],
        },
    ],
];
