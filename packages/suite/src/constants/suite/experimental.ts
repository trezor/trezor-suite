import { TranslationKey } from '@suite-common/intl-types';

export enum ExperimentalFeature {}

type FeatureIntlMap = Partial<Record<ExperimentalFeature, TranslationKey>>;

export const ExperimentalFeatureTitle: FeatureIntlMap = {};

export const ExperimentalFeatureDescription: FeatureIntlMap = {};
