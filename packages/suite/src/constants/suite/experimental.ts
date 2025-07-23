import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { isDesktop, isLinux } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, HELP_CENTER_TOR_URL, Url } from '@trezor/urls';

import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';
import { selectIsBioAuthAvailable } from 'src/reducers/bioAuth';

import { AppState, Dispatch } from '../../types/suite';

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'nft-section'
    | 'trezor-connect-ws'
    | 'biometric-authentication';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    knowledgeBaseUrl?: Url;
    routeName?: Route['name'];
    isDisabled?: (context: { isDebug: boolean; state: AppState }) => boolean;
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
    'trezor-connect-ws': {
        title: 'TR_EXPERIMENTAL_TREZORCONNECT_WS',
        description: 'TR_EXPERIMENTAL_TREZORCONNECT_WS_DESCRIPTION',
        isDisabled: () => !isDesktop(),
        onToggle: async ({ newValue }) => {
            await desktopApi.connectPopupSetEnabled(newValue);
        },
    },
    'biometric-authentication': {
        title: 'TR_BIO_AUTH',
        description: 'TR_BIO_AUTH_DESCRIPTION',
        isDisabled: ({ state }) => !isDesktop() || isLinux() || !selectIsBioAuthAvailable(state),
        onToggle: async ({ dispatch, translationString }) => {
            const result = await dispatch(
                requestBioAuthChangeThunk({
                    translationString,
                }),
            ).unwrap();

            if (!result?.success) {
                throw new Error('Could not change bio auth');
            }
        },
    },
};
