import { FontAssetType, OtherAssetType, generateFonts } from 'fantasticon';
import { constants } from 'fs';
import path from 'path';

import type { LoggerDep } from '@trezor/logger';
import type { CopyFileDep, MkdirDep, ReadFileDep, RmDep, WriteFileDep } from '@trezor/type-utils';

import { mobileIconFontConfig } from './mobileIconFontConfig';

export type GenerateIconFontDeps = LoggerDep &
    CopyFileDep &
    MkdirDep &
    ReadFileDep &
    RmDep &
    WriteFileDep & {
        repositoryRoot: string;
    };

export type GenerateIconFont = () => Promise<void>;

export type GenerateIconFontDep = { generateIconFont: GenerateIconFont };

export const createGenerateIconFont =
    (deps: GenerateIconFontDeps): GenerateIconFont =>
    async () => {
        const iconsDirectory = path.join(deps.repositoryRoot, 'suite-common/icons');
        const assetsDirectory = path.join(deps.repositoryRoot, 'packages/icons/assets');
        const temporaryDirectory = path.join(iconsDirectory, 'assetsTemp');
        const outputDirectory = path.join(iconsDirectory, 'iconFontsMobile');

        deps.logger.log('Generating icon font for mobile...');

        await deps.rm(temporaryDirectory, { recursive: true, force: true });
        await deps.rm(outputDirectory, { recursive: true, force: true });
        await deps.mkdir(temporaryDirectory, { recursive: true });

        for (const icon of mobileIconFontConfig.iconNames) {
            await deps.copyFile(
                path.join(assetsDirectory, `${icon}.svg`),
                path.join(temporaryDirectory, `${icon}.svg`),
                constants.COPYFILE_FICLONE,
            );
        }

        await deps.mkdir(outputDirectory, { recursive: true });
        await generateFonts({
            inputDir: temporaryDirectory,
            outputDir: outputDirectory,
            name: mobileIconFontConfig.fontName,
            fontTypes: [FontAssetType.TTF],
            assetTypes: [OtherAssetType.JSON],
            formatOptions: { json: { indent: 4 } },
            templates: {},
            pathOptions: {},
            codepoints: {},
            fontHeight: 300,
            normalize: false,
            tag: 'i',
            prefix: 'icon',
        });

        const metadataPath = path.join(outputDirectory, `${mobileIconFontConfig.fontName}.json`);
        const metadata = await deps.readFile(metadataPath);
        await deps.writeFile(metadataPath, Buffer.concat([metadata, Buffer.from('\n')]));

        deps.logger.log('Icon font for mobile generated.');
    };
