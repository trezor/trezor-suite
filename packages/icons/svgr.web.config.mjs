import indexTemplate from './icon-index-template.mjs';
import { svgoConfig } from './svgoConfig.mjs';

/** @type {import('@svgr/core').Config} */
const config = {
    typescript: true,
    prettier: false,
    index: true,
    silent: true,
    outDir: 'src/generated/icons',
    svgoConfig,
    indexTemplate,
    replaceAttrValues: {
        '#000': 'currentColor',
        '#000000': 'currentColor',
    },
};

export default config;
