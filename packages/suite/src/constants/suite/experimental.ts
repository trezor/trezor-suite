import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { labelingActions } from '@suite-common/local-first-storage';
import { Route } from '@suite-common/suite-types';
import { networksCollection } from '@suite-common/wallet-config';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, HELP_CENTER_TOR_URL, Url } from '@trezor/urls';

import { Dispatch } from '../../types/suite';

const experimentalNetworks = networksCollection.filter(
    network => network.isExperimentalOnlyNetwork,
);
const experimentalNetworkNames = experimentalNetworks.map(network => network.name);

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'nft-section'
    | 'global-send-receive'
    | 'experimental-networks'
    | 'suite-sync';

export type ExperimentalFeatureConfig = {
    title: ExtendedMessageDescriptor;
    description: ExtendedMessageDescriptor;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean }) => boolean;
    onToggle?: ({ newValue, dispatch }: { newValue: boolean; dispatch: Dispatch }) => void;
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
    'nft-section': {
        title: { id: 'TR_EXPERIMENTAL_NFT_SECTION' },
        description: { id: 'TR_EXPERIMENTAL_NFT_SECTION_DESCRIPTION' },
    },
    'global-send-receive': {
        title: { id: 'TR_EXPERIMENTAL_GLOBAL_SEND_RECEIVE' },
        description: { id: 'TR_EXPERIMENTAL_GLOBAL_SEND_RECEIVE_DESCRIPTION' },
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
    },
    'suite-sync': {
        title: { id: 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE' },
        description: { id: 'TR_EXPERIMENTAL_SUITE_SYNC_DESCRIPTION' },
        onToggle: ({ newValue, dispatch }) => {
            dispatch(
                labelingActions.updateIsFeatureLocalFirstStorageAvailable({
                    isShownInSettings: newValue,
                }),
            );
        },
    },
};
