import { ExtendedMessageDescriptor } from '@suite/intl';
import { Route } from '@suite-common/suite-types';
import { networksCollection } from '@suite-common/wallet-config';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, HELP_CENTER_TOR_URL, Url } from '@trezor/urls';

import { SuiteServices } from '../../support/extraDependencies';

export type { ExperimentalFeature } from '@suite/experimental';

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
    onToggle?: ({ newValue, services }: { newValue: boolean; services: SuiteServices }) => void;
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
    'suite-sync': {
        title: { id: 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE' },
        description: { id: 'TR_EXPERIMENTAL_SUITE_SYNC_DESCRIPTION' },
        onToggle: ({ newValue, services }) => {
            if (!newValue) {
                // Turn off Suite Sync
                services.suiteSync.turnOffSuiteSync();
            }
        },
    },
};
