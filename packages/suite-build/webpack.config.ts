import { merge } from 'webpack-merge';

// Env utils
import { project, isDev } from './utils/env';

// Configs
import base from './configs/base.webpack.config';
import dev from './configs/dev.webpack.config';
import web from './configs/web.webpack.config';
import desktop from './configs/desktop.webpack.config';

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

module.exports = merge(configs);
