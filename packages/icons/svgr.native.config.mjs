import indexTemplate from './icon-index-template.mjs';
import { svgoConfig } from './svgoConfig.mjs';

/** @type {import('@svgr/core').Config} */
const config = {
    native: true,
    typescript: true,
    prettier: false,
    index: false,
    ext: 'native.tsx',
    silent: true,
    outDir: 'src/generated/icons',
    jsxRuntime: 'automatic',
    indexTemplate,
    svgoConfig: {
        ...svgoConfig,
        plugins: [
            ...svgoConfig.plugins,
            {
                name: 'removeAttrs',
                params: {
                    elemSeparator: ';',
                    attrs: ['*;class', '*;className', '*;xml:space', '*;xmlSpace'],
                },
            },
        ],
    },
};

export default config;
