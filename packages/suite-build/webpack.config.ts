import { merge } from 'webpack-merge';

// Env utils
// Configs

import base from './configs/base.webpack.config';
import desktop from './configs/desktop.webpack.config';
import dev from './configs/dev.webpack.config';
import tauri from './configs/tauri.webpack.config';
import web from './configs/web.webpack.config';
import { isDev, project } from './utils/env';

const configs = [
    base,
    ...(isDev ? [dev] : []),
    ...(project === 'web' ? [web] : []),
    ...(project === 'desktop' ? [desktop] : []),
    ...(project === 'tauri' ? [tauri] : []),
];

// Prevent "webpack: TypeError: Do not know how to serialize a BigInt"
// @ts-expect-error
BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
};

module.exports = merge(configs);
