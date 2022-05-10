import fs from 'fs';
import path from 'path';
import { optimize } from 'svgo';
import prettier from 'prettier';

const assetsDir = './src/Icon/assets';
const iconTypesFilePath = './src/Icon/iconTypes.ts';

// https://github.com/svg/svgo#built-in-plugins
const svgoConfig = {
    multipass: true,
    js2svg: {
        indent: 2, // string with spaces or number of spaces. 4 by default
        pretty: true, // boolean, false by default
    },
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false,
                },
            },
        },
        'removeXMLNS',
        'prefixIds',
        // it's necessary to remove all dimension tags to allow resizing
        'removeDimensions',
        'removeRasterImages',
        'removeScriptElement',
    ],
};

(async () => {
    const iconFileNames = fs.readdirSync(assetsDir);
    const icons = iconFileNames
        .map(fileName => ({
            fileName,
            content: fs.readFileSync(path.resolve(assetsDir, fileName)).toString(),
        }))
        .map(({ fileName, content }) => ({
            fileName,
            content: optimize(content, svgoConfig).data,
        }));

    const iconTypesFileContent = `
    /* eslint-disable global-require */

    // !!! IMPORTANT: This file is autogenerated !!!
    // If you want to add of modify icons please read README.md to find out how to do it

    export const iconTypes = {
        ${icons
            .map(
                ({ fileName, content }) =>
                    `${fileName.replace('.svg', '')}: require('./assets/${fileName}')`,
            )
            .join(',')}
    } as const;

    export type IconType = keyof typeof iconTypes;
    `;

    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath)),
        parser: 'babel-ts',
    };

    const formattedIconTypesFileContent = prettier.format(iconTypesFileContent, prettierConfig);

    fs.writeFileSync(path.resolve(iconTypesFilePath), formattedIconTypesFileContent);

    icons.forEach(({ fileName, content }) =>
        fs.writeFileSync(path.resolve(assetsDir, fileName), content),
    );
})();
