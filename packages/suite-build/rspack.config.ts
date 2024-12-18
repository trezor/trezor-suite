// webpack-merge supports Rspack configs https://github.com/web-infra-dev/rspack/issues/6059#issuecomment-2027385233
import { merge } from 'webpack-merge';

// Env utils
import { project, isDev } from './utils/env';
// Configs
import base from './configs/base.rspack.config';
import dev from './configs/dev.rspack.config';
import web from './configs/web.rspack.config';
import desktop from './configs/desktop.rspack.config';

const configs = [base];
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
