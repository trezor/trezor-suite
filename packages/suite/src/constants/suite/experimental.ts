import { TranslationKey } from '@suite-common/intl-types';

export enum ExperimentalFeature {
    BnbSmartChain = 'bnb-smart-chain',
    PasswordManager = 'password-manager',
    TorSnowflake = 'tor-snowflake',
}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {
    [ExperimentalFeature.BnbSmartChain]: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN',
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    [ExperimentalFeature.TorSnowflake]: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
};

export const ExperimentalFeatureDescription: FeatureIntlMap = {
    [ExperimentalFeature.BnbSmartChain]: 'TR_EXPERIMENTAL_BNB_SMART_CHAIN_DESCRIPTON',
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
    [ExperimentalFeature.TorSnowflake]: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
};
