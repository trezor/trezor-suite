import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import path from 'path';

import {
    createDownloadCryptoIcons,
    createDownloadVaultIcons,
    createGenerateIconFont,
    createGenerateIcons,
    createVaultIconsClient,
    rasterizeSvg,
} from '@suite-common/icons/scripts';
import {
    createGetIconPaths,
    createGetNetworkByCoingeckoId,
    createGetNetworkConfig,
    createIsWrappedNativeToken,
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
} from '@suite-common/networks';
import type { LoggerDep } from '@trezor/logger';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { type CliAppDep, createCliApp } from './createCliApp';

export type CliCompositionRootDeps = NetworkSuiteCommonModuleApi & LoggerDep;

export type CliCompositionRoot = CliAppDep;

export const createCliCompositionRoot = (deps: CliCompositionRootDeps): CliCompositionRoot => {
    const networkModules = createNetworkModulesCompositionRoot(deps);
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
    const getNetworkByCoingeckoId = createGetNetworkByCoingeckoId({
        networkModuleRepository,
        getNetworkConfig,
    });
    const isWrappedNativeToken = createIsWrappedNativeToken({ networkModuleRepository });
    const getIconPaths = createGetIconPaths({ networkModuleRepository });
    const vaultIconsClient = createVaultIconsClient({ logger: deps.logger, fetch });
    const downloadVaultIcons = createDownloadVaultIcons({
        fetchYieldVaults: vaultIconsClient.fetchYieldVaults,
        fetchPublishedIcon: vaultIconsClient.fetchPublishedIcon,
        logger: deps.logger,
        getIconPaths,
        isSupportedNetwork: networkModuleRepository.isSupportedNetwork,
        getNetworkByCoingeckoId,
        isWrappedNativeToken,
        readFile,
        rasterizeSvg,
        writeFile,
        mkdir,
    });
    const downloadCryptoIcons = createDownloadCryptoIcons({ downloadVaultIcons, now: Date.now });
    const repositoryRoot = path.resolve(__dirname, '../../..');
    const generateIcons = createGenerateIcons({
        repositoryRoot,
        logger: deps.logger,
        readDirectory: readdir,
        readFile,
        writeFile,
    });
    const generateIconFont = createGenerateIconFont({
        repositoryRoot,
        logger: deps.logger,
        copyFile,
        rm,
        mkdir,
        readFile,
        writeFile,
    });
    const cliApp = createCliApp({
        logger: deps.logger,
        commands: [
            { name: 'download-crypto-icons', exec: downloadCryptoIcons },
            { name: 'generate-icons', exec: generateIcons },
            { name: 'generate-icon-font', exec: generateIconFont },
        ],
    });

    return { cliApp };
};
