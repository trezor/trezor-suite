/**
 * @type {import('svgo').Config}
 */
// eslint-disable-next-line import/no-default-export
export default {
    multipass: true,
    js2svg: {
        indent: 2, // string with spaces or number of spaces. 4 by default
        pretty: true, // boolean, false by default
    },
    plugins: [
        {
            name: 'preset-default',
        },
        {
            name: 'removeViewBox',
            active: false,
        },
        'prefixIds',
        // it's necessary to remove all dimension tags to allow resizing
        'removeDimensions',
        'removeRasterImages',
        'removeScripts',
        'convertStyleToAttrs',
    ],
};
