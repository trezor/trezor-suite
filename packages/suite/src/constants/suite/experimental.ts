import { TranslationKey } from '@suite-common/intl-types';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, TOR_SNOWFLAKE_KB_URL, Url } from '@trezor/urls';

import { Dispatch } from '../../types/suite';

export type ExperimentalFeature = 'password-manager' | 'optimism' | 'tor-snowflake';

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
    optimism: {
        title: 'TR_EXPERIMENTAL_OP_ETHEREUM',
        description: 'TR_EXPERIMENTAL_OP_ETHEREUM_DESCRIPTION',
    },
    'tor-snowflake': {
        title: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
        description: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
        knowledgeBaseUrl: TOR_SNOWFLAKE_KB_URL,
    },
};
