import { type TranslationKey } from '@suite/intl';
import { type BackupType } from '@suite-common/suite-types';

export const typesToLabelMap: Record<BackupType, TranslationKey> = {
    'shamir-single': 'TR_ONBOARDING_SEED_TYPE_SINGLE_SEED',
    'shamir-advanced': 'TR_ONBOARDING_SEED_TYPE_ADVANCED',
    '12-words': 'TR_ONBOARDING_SEED_TYPE_12_WORDS',
    '24-words': 'TR_ONBOARDING_SEED_TYPE_24_WORDS',
};
