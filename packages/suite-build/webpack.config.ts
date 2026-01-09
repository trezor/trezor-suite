import { merge } from 'webpack-merge';

// Env utils
// Configs

import base from './configs/base.webpack.config';
import connect from './configs/connect.webpack.config';
import desktop from './configs/desktop.webpack.config';
import dev from './configs/dev.webpack.config';
import web from './configs/web.webpack.config';
import { isDev, project } from './utils/env';

// hmm I would be happy not to have connect config part of desktop, but desktop has in fact web
// targeted configs and without connect config, suite-desktop ui would not be built
const configs = [connect, base];
if (isDev) {
    configs.push(dev);
}

switch (project) {
    case 'web':
        configs.push(web);
        break;
    case 'desktop':
        configs.push(desktop);
        break;
    // no default
}

// Prevent "webpack: TypeError: Do not know how to serialize a BigInt"
// @ts-expect-error
BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
};

module.exports = merge(configs);
