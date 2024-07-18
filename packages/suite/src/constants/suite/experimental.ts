import { TranslationKey } from '@suite-common/intl-types';

export enum ExperimentalFeature {
    PasswordManager = 'password-manager',
    ConfirmLessLabeling = 'confirm-less-labeling',
}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    [ExperimentalFeature.ConfirmLessLabeling]: 'TR_EXPERIMENTAL_CONFIRM_LESS_LABELING',
};

export const ExperimentalFeatureDescription: FeatureIntlMap = {
    [ExperimentalFeature.PasswordManager]: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
    [ExperimentalFeature.ConfirmLessLabeling]: 'TR_EXPERIMENTAL_CONFIRM_LESS_LABELING_DESCRIPTION',
};
