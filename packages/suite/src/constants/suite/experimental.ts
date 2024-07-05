import { TranslationKey } from '@suite-common/intl-types';

export enum ExperimentalFeature {
    PasswordManager = 'password-manager',
}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
};

export const ExperimentalFeatureDescription: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
};
