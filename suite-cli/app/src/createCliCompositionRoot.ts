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
} from '@suite-common/networks';
import type { LoggerDep } from '@trezor/logger';
import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

import { type CliAppDep, createCliApp } from './createCliApp';

export type CliCompositionRootDeps = NetworkSuiteCommonModuleApi & LoggerDep;

export type CliCompositionRoot = CliAppDep;

export const createCliCompositionRoot = (deps: CliCompositionRootDeps): CliCompositionRoot => {
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: [
            createBitcoinSuiteCommonNetworkModule(),
            createEthereumSuiteCommonNetworkModule(deps),
            createRippleSuiteCommonNetworkModule(),
            createCardanoSuiteCommonNetworkModule(),
            createSolanaSuiteCommonNetworkModule(),
            createStellarSuiteCommonNetworkModule(),
            createTronSuiteCommonNetworkModule(),
        ],
    });
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
