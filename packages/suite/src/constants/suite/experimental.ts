import { TranslationKey } from '@suite-common/intl-types';
import { EXPERIMENTAL_PASSWORD_MANAGER_KB_URL, TOR_SNOWFLAKE_KB_URL } from '@trezor/urls';

export enum ExperimentalFeature {
    PasswordManager = 'password-manager',
    TorSnowflake = 'tor-snowflake',
}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    [ExperimentalFeature.TorSnowflake]: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
};

export const ExperimentalFeatureDescription: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
    [ExperimentalFeature.TorSnowflake]: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
};

export const ExperimentalFeatureKnowledgeBaseUrl = {
    [ExperimentalFeature.PasswordManager]: EXPERIMENTAL_PASSWORD_MANAGER_KB_URL,
    [ExperimentalFeature.TorSnowflake]: TOR_SNOWFLAKE_KB_URL,
};
