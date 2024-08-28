import { TranslationKey } from '@suite-common/intl-types';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, TOR_SNOWFLAKE_KB_URL, Url } from '@trezor/urls';

import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Dispatch } from '../../types/suite';

export type ExperimentalFeature =
    | 'password-manager'
    | 'bnb-smart-chain'
    | 'tor-snowflake'
    | 'automatic-update';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    knowledgeBaseUrl?: Url;
    isDisabled?: (context: { isDebug: boolean }) => boolean;
    onToggle?: ({ newValue, dispatch }: { newValue: boolean; dispatch: Dispatch }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'password-manager': {
        title: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
        description: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
        knowledgeBaseUrl: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
    },
    'automatic-update': {
        title: 'TR_EXPERIMENTAL_AUTOMATIC_UPDATE',
        description: 'TR_EXPERIMENTAL_AUTOMATIC_UPDATE_DESCRIPTION',
        isDisabled: () => !isDesktop(),
        onToggle: ({ newValue }) => {
            desktopApi.setAutomaticUpdateEnabled(newValue);
        },
    },
    'bnb-smart-chain': {
        title: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN',
        description: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN_DESCRIPTON',
    },
    'tor-snowflake': {
        title: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
        description: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
        knowledgeBaseUrl: TOR_SNOWFLAKE_KB_URL,
    },
};
