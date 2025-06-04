import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import {
    EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
    HELP_CENTER_TOR_URL,
    HELP_CENTER_XLM_URL,
    Url,
} from '@trezor/urls';

import { Dispatch } from '../../types/suite';

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'nft-section'
    | 'trezor-connect-ws'
    | 'walletconnect'
    | 'stellar-support';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean }) => boolean;
    onToggle?: ({ newValue, dispatch }: { newValue: boolean; dispatch: Dispatch }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'password-manager': {
        title: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
        description: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
        knowledgeBaseUrl: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
        routeName: 'password-manager-index',
    },
    'tor-external': {
        title: 'TR_EXPERIMENTAL_TOR_EXTERNAL',
        description: 'TR_EXPERIMENTAL_TOR_EXTERNAL_DESCRIPTION',
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
        title: 'TR_EXPERIMENTAL_NFT_SECTION',
        description: 'TR_EXPERIMENTAL_NFT_SECTION_DESCRIPTION',
    },
    'trezor-connect-ws': {
        title: 'TR_EXPERIMENTAL_TREZORCONNECT_WS',
        description: 'TR_EXPERIMENTAL_TREZORCONNECT_WS_DESCRIPTION',
        isDisabled: () => !isDesktop(),
        onToggle: async ({ newValue }) => {
            await desktopApi.connectPopupSetEnabled(newValue);
        },
    },
    walletconnect: {
        title: 'TR_WALLETCONNECT',
        description: 'TR_EXPERIMENTAL_WALLETCONNECT_DESCRIPTION',
        isDisabled: () => !isDesktop(),
    },
    'stellar-support': {
        title: 'TR_EXPERIMENTAL_STELLAR_SUPPORT',
        description: 'TR_EXPERIMENTAL_STELLAR_SUPPORT_DESCRIPTION',
        knowledgeBaseUrl: HELP_CENTER_XLM_URL,
    },
};
