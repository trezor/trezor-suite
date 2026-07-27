// https://github.com/svg/svgo#built-in-plugins
/**
 * @type {import('svgo').Config}
 */
export const svgoConfig = {
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
        {
            name: 'addAttributesToSVGElement',
            params: {
                attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
        },
        {
            name: 'convertColors',
            params: {
                currentColor: true,
            },
        },
        'prefixIds',
        // it's necessary to remove all dimension tags to allow resizing
        'removeDimensions',
        'removeRasterImages',
        'convertStyleToAttrs',
    ],
};
