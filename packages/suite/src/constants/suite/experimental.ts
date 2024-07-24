import { TranslationKey } from '@suite-common/intl-types';

export enum ExperimentalFeature {
    PasswordManager = 'password-manager',
    BinanceSmartChain = 'binance-smart-chain',
}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    [ExperimentalFeature.BinanceSmartChain]: 'TR_EXPERIMENTAL_NETWORK_BSC',
};

export const ExperimentalFeatureDescription: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
    [ExperimentalFeature.BinanceSmartChain]: 'TR_EXPERIMENTAL_NETWORK_BSC_DESCRIPTION',
};
