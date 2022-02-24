import * as path from 'path';

// we cannot import file outside root dir as module in TS composite project
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require('../../../tsconfig.aliases.json');

const { paths } = compilerOptions;
type PathKey = keyof typeof paths;

const getPath = (key: PathKey) => {
    let p = paths[key][0];
    if (p.endsWith('index')) {
        p = p.slice(0, -5);
    }

    return path.join(__dirname, '..', '..', '..', p);
};

// Alias
const alias: { [key: string]: string } = {};
Object.keys(paths)
    .filter(p => !p.includes('*'))
    .forEach((key: string) => {
        alias[key] = path.resolve(getPath(key as PathKey));
    });

export default alias;
