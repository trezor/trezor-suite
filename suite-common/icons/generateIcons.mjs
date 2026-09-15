/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { optimize } from 'svgo';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const iconsFilePath = './src/icons.ts';
const cryptoIconsPath = './src/cryptoIcons.ts';
const networkIconsPath = './src/networkIcons.ts';
const paymentMethodLogosPath = './src/paymentMethodLogos.ts';

const assetTypesConfig = [
    {
        name: 'icons',
        dirname: '../../packages/icons/assets',
        typeName: 'IconName',
    },
];

const cryptoAssetsTypesConfig = [
    {
        name: 'cryptoIcons',
        dirname: 'cryptoAssets/cryptoIcons',
        moduleAssets: true,
        typeName: 'CryptoIconName',
    },
];

const paymentMethodLogosAssetsTypesConfig = [
    {
        name: 'paymentMethodLogos',
        dirname: 'paymentMethods',
        typeName: 'PaymentMethodLogoName',
        raster: true,
    },
];

const networkAssetsTypesConfig = [
    {
        name: 'networkIcons',
        dirname: 'cryptoAssets/networkIcons',
        typeName: 'NetworkIconName',
        moduleAssets: true,
    },
];

// https://github.com/svg/svgo#built-in-plugins
/**
 * @type {import('svgo').Config}
 */
const svgoConfig = {
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
        'prefixIds',
        // it's necessary to remove all dimension tags to allow resizing
        'removeDimensions',
        'removeRasterImages',
        'removeScripts',
        'convertStyleToAttrs',
    ],
};

const optimizeSvgAssets = assetsDirname => {
    const assetsDir = path.join(__dirname, assetsDirname);
    const assetFileNames = fs.readdirSync(assetsDir);

    return assetFileNames
        .filter(fileName => fileName.endsWith('.svg'))
        .map(fileName => ({
            fileName,
            content: fs.readFileSync(path.resolve(assetsDir, fileName)).toString(),
        }))
        .map(({ fileName, content }) => ({
            fileName,
            content: optimize(content, svgoConfig).data,
        }));
};

const listRasterAssets = assetsDirname => {
    const assetsDir = path.join(__dirname, assetsDirname);

    return fs
        .readdirSync(assetsDir)
        .filter(fileName => fileName.endsWith('.webp'))
        .map(fileName => ({ fileName }));
};

// The compatibility catalogs used by native discover module-owned assets automatically.
const listNetworkAssets = legacyDirname => {
    const kind = path.basename(legacyDirname);
    const networksDir = path.resolve(__dirname, '../../networks');
    const directories = fs.existsSync(path.resolve(__dirname, legacyDirname))
        ? [{ assetDirname: legacyDirname }]
        : [];
    for (const family of fs.readdirSync(networksDir, { withFileTypes: true })) {
        if (!family.isDirectory()) continue;
        const familyDir = path.join(networksDir, family.name);
        for (const module of fs.readdirSync(familyDir, { withFileTypes: true })) {
            if (!module.isDirectory() || !module.name.endsWith('-assets')) continue;
            const assetsDir = path.join(familyDir, module.name, 'assets', kind);
            if (fs.existsSync(assetsDir)) {
                const packageJson = JSON.parse(
                    fs.readFileSync(path.join(familyDir, module.name, 'package.json'), 'utf8'),
                );
                directories.push({
                    assetDirname: path.relative(__dirname, assetsDir),
                    packageName: packageJson.name,
                });
            }
        }
    }
    const assets = directories
        .flatMap(({ assetDirname, packageName }) =>
            fs
                .readdirSync(path.resolve(__dirname, assetDirname))
                .filter(fileName => fileName.endsWith('.svg'))
                .map(fileName => ({ fileName, assetDirname, packageName })),
        )
        .sort((a, b) => a.fileName.localeCompare(b.fileName));
    const seen = new Set();
    for (const { fileName } of assets) {
        if (seen.has(fileName)) throw new Error(`Duplicate ${kind} asset: ${fileName}`);
        seen.add(fileName);
    }

    return assets;
};

const getOptimizedAssetTypes = assetTypesArray =>
    assetTypesArray.map(config => {
        if (config.moduleAssets) {
            return { ...config, assets: listNetworkAssets(config.dirname) };
        }

        return {
            ...config,
            assets: config.raster
                ? listRasterAssets(config.dirname)
                : optimizeSvgAssets(config.dirname),
        };
    });

const generateIconsFileContent = assetTypesArray => {
    const mappedAssetTypes = assetTypesArray.map(
        ({ name, assets, dirname, typeName }) => `
           export const ${name} = {
            ${assets
                .map(({ fileName, assetDirname = dirname, packageName }) => {
                    const importPath = packageName
                        ? `${packageName}/assets/${path.basename(assetDirname)}`
                        : `../${assetDirname}`;

                    return `${fileName.replace(/\.(svg|webp)$/, '')}: require('${importPath}/${fileName}')`;
                })
                .join(',')}
        } as const;
        export type ${typeName} = keyof typeof ${name};
       `,
    );

    return `
    // !!! IMPORTANT: This file is autogenerated !!!
    // If you want to add of modify icons please read README.md to find out how to do it

    ${mappedAssetTypes.join('')}
    `;
};

const writeOptimizedAssets = assetTypesArray => {
    assetTypesArray.forEach(({ assets, dirname, raster, moduleAssets }) => {
        if (raster || moduleAssets) {
            return;
        }
        assets.forEach(({ fileName, content }) =>
            fs.writeFileSync(path.resolve(dirname, fileName), content),
        );
    });
};

const generateFileForAssetTypes = async (assetTypesArray, outputFilePath) => {
    const assetTypes = getOptimizedAssetTypes(assetTypesArray);

    const iconsFileContent = generateIconsFileContent(assetTypes);

    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath)),
        parser: 'babel-ts',
    };

    const formattedIconTypesFileContent = await prettier.format(iconsFileContent, prettierConfig);

    fs.writeFileSync(path.resolve(outputFilePath), formattedIconTypesFileContent);

    writeOptimizedAssets(assetTypes);
};

(async () => {
    if (!process.argv.includes('--network-icons-only')) {
        console.log('Generating icons TS file...');
        await generateFileForAssetTypes(assetTypesConfig, iconsFilePath);
        console.log(chalk.green('Icons TS file generated successfully'));
    }
    console.log('Generating crypto icons TS file...');
    await generateFileForAssetTypes(cryptoAssetsTypesConfig, cryptoIconsPath);
    console.log(chalk.green('Crypto icons TS file generated successfully'));
    console.log('Generating network icons TS file...');
    await generateFileForAssetTypes(networkAssetsTypesConfig, networkIconsPath);
    console.log(chalk.green('Network icons TS file generated successfully'));
    if (!process.argv.includes('--network-icons-only')) {
        console.log('Generating payment method logos TS file...');
        await generateFileForAssetTypes(
            paymentMethodLogosAssetsTypesConfig,
            paymentMethodLogosPath,
        );
        console.log(chalk.green('Payment method logos TS file generated successfully'));
    }
})();
