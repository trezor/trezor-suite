import { mkdir, readFile, writeFile } from 'fs/promises';

import {
    createDownloadCryptoIcons,
    createDownloadVaultIcons,
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
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { type CliAppDep, createCliApp } from './createCliApp';

export type CliCompositionRootDeps = NetworkSuiteCommonModuleApi;

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
    const logger = console;
    const vaultIconsClient = createVaultIconsClient({ logger, fetch });
    const downloadVaultIcons = createDownloadVaultIcons({
        fetchYieldVaults: vaultIconsClient.fetchYieldVaults,
        fetchPublishedIcon: vaultIconsClient.fetchPublishedIcon,
        logger,
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
    const cliApp = createCliApp({ downloadCryptoIcons });

    return { cliApp };
};
