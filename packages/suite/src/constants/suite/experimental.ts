import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { isDesktop, isLinux } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, HELP_CENTER_TOR_URL, Url } from '@trezor/urls';

import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';

import { Dispatch } from '../../types/suite';

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'nft-section'
    | 'biometric-authentication'
    | 'global-send-receive';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean; isBioAuthAvailable: boolean }) => boolean;
    onToggle?: ({
        newValue,
        dispatch,
        translationString,
    }: {
        newValue: boolean;
        dispatch: Dispatch;
        translationString: TranslationFunction;
    }) => void;
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
    'biometric-authentication': {
        title: 'TR_BIO_AUTH',
        description: 'TR_BIO_AUTH_DESCRIPTION',
        isDisabled: ({ isBioAuthAvailable }) => !isDesktop() || isLinux() || !isBioAuthAvailable,
        onToggle: async ({ dispatch, translationString, newValue }) => {
            const result = await dispatch(
                requestBioAuthChangeThunk({
                    translationString,
                    nextBioAuthEnabledValue: newValue,
                }),
            ).unwrap();

            if (!result?.success) {
                throw new Error('Could not change bio auth');
            }
        },
    },
    'global-send-receive': {
        title: 'TR_EXPERIMENTAL_GLOBAL_SEND_RECEIVE',
        description: 'TR_EXPERIMENTAL_GLOBAL_SEND_RECEIVE_DESCRIPTION',
    },
};
