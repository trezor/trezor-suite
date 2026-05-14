import type { ExperimentalFeature } from '@suite/experimental';
import { type ExtendedMessageDescriptor } from '@suite/intl';
import { type Route } from '@suite/router';
import { networksCollection } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import {
    EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
    GITHUB_MCP_DOCS_URL,
    HELP_CENTER_TOR_URL,
    type Url,
} from '@trezor/urls';

import { type SuiteServices } from '../../support/extraDependencies';
import { type Dispatch } from '../../types/suite';

const experimentalNetworks = networksCollection.filter(
    network => network.isExperimentalOnlyNetwork,
);
const experimentalNetworkNames = experimentalNetworks.map(network => network.name);

export type ExperimentalFeatureConfig = {
    title: ExtendedMessageDescriptor;
    description: ExtendedMessageDescriptor;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean }) => boolean;
    onToggle?: ({
        newValue,
        services,
        dispatch,
    }: {
        newValue: boolean;
        services: SuiteServices;
        dispatch: Dispatch;
    }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'password-manager': {
        title: { id: 'TR_EXPERIMENTAL_PASSWORD_MANAGER' },
        description: { id: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION' },
        knowledgeBaseUrl: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
        routeName: 'password-manager-index',
    },
    'tor-external': {
        title: { id: 'TR_EXPERIMENTAL_TOR_EXTERNAL' },
        description: { id: 'TR_EXPERIMENTAL_TOR_EXTERNAL_DESCRIPTION' },
        knowledgeBaseUrl: HELP_CENTER_TOR_URL,
        isDisabled: () => !isDesktop(),
        onToggle: async ({ newValue }) => {
            const result = await desktopApi.getTorSettings();
            if (result.success && result.payload.useExternalTor !== newValue) {
                await desktopApi.changeTorSettings({
                    ...result.payload,
                    useExternalTor: newValue,
                });
            }
        },
    },
    'testnet-networks': {
        title: { id: 'TR_EXPERIMENTAL_TESTNET_NETWORKS' },
        description: { id: 'TR_EXPERIMENTAL_TESTNET_NETWORKS_DESCRIPTION' },
    },
    'nft-section': {
        title: { id: 'TR_EXPERIMENTAL_NFT_SECTION' },
        description: { id: 'TR_EXPERIMENTAL_NFT_SECTION_DESCRIPTION' },
    },
    slip24: {
        title: { id: 'TR_EXPERIMENTAL_SLIP24' },
        description: { id: 'TR_EXPERIMENTAL_SLIP24_DESCRIPTION' },
        isDisabled: ({ isDebug }) => !isDebug,
    },
    'experimental-networks': {
        title: {
            id: 'TR_EXPERIMENTAL_NETWORKS',
            values: {
                networkNames: experimentalNetworkNames.join(', '),
                count: experimentalNetworks.length,
            },
        },
        description: {
            id: 'TR_EXPERIMENTAL_NETWORKS_DESCRIPTION',
            values: {
                networkNames: experimentalNetworkNames.join(', '),
                count: experimentalNetworks.length,
            },
        },
        isDisabled: () => experimentalNetworks.length === 0,
    },
    'tron-view-only': {
        title: { id: 'TR_EXPERIMENTAL_TRON_VIEW_ONLY' },
        description: { id: 'TR_EXPERIMENTAL_TRON_VIEW_ONLY_DESCRIPTION' },
    },
    'mcp-server': {
        title: { id: 'TR_EXPERIMENTAL_MCP_SERVER' },
        description: { id: 'TR_EXPERIMENTAL_MCP_SERVER_DESCRIPTION' },
        knowledgeBaseUrl: GITHUB_MCP_DOCS_URL,
        isDisabled: () => !isDesktop(),
        onToggle: async ({ newValue }) => {
            await desktopApi.mcpSetEnabled(newValue);
        },
    },
    'gap-limit': {
        title: { id: 'TR_EXPERIMENTAL_GAP_LIMIT' },
        description: { id: 'TR_EXPERIMENTAL_GAP_LIMIT_DESCRIPTION' },
        // TODO: let's add some knowledgeBaseUrl post if we move this forward.
        onToggle: ({ newValue, dispatch }) => {
            if (!newValue) {
                networksCollection
                    .filter(network => network.networkType === 'bitcoin')
                    .forEach(({ symbol }) =>
                        dispatch(
                            blockchainActions.setBackendGapLimit({ symbol, gapLimit: undefined }),
                        ),
                    );
            }
        },
    },
};
