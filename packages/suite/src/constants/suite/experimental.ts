import { TranslationKey } from '@suite-common/intl-types';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, TOR_SNOWFLAKE_KB_URL, Url } from '@trezor/urls';

import { isDesktop } from '@trezor/env-utils';

export type ExperimentalFeature =
    | 'password-manager'
    | 'silent-update'
    | 'bnb-smart-chain'
    | 'tor-snowflake';

export type ExperimentalFeatureConfig = {
    title: TranslationKey;
    description: TranslationKey;
    isEnabled: (context: { isDebug: boolean }) => boolean;
    knowledgeBaseUrl?: Url;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'password-manager': {
        title: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
        description: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
        isEnabled: ({ isDebug }) => isDebug,
        knowledgeBaseUrl: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
    },
    'silent-update': {
        title: 'TR_EXPERIMENTAL_SILENT_UPDATE',
        description: 'TR_EXPERIMENTAL_SILENT_UPDATE_DESCRIPTION',
        isEnabled: isDesktop,
    },
    'bnb-smart-chain': {
        title: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN',
        description: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN_DESCRIPTON',
        isEnabled: () => true,
    },
    'tor-snowflake': {
        title: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
        description: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
        isEnabled: () => true,
        knowledgeBaseUrl: TOR_SNOWFLAKE_KB_URL,
    },
};
