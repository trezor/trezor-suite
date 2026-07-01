import indexTemplate from './icon-index-template.mjs';
import { svgoConfig } from './svgoConfig.mjs';

/** @type {import('@svgr/core').Config} */
const config = {
    typescript: true,
    prettier: false,
    index: true,
    silent: true,
    outDir: 'src/generated/icons',
    jsxRuntime: 'automatic',
    svgoConfig,
    exportType: 'named',
    indexTemplate,
};

export default config;
