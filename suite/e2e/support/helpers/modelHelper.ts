import { Model } from '@trezor/trezor-user-env-link';

export const isModelWithSecureElement = (model: Model): boolean =>
    ['T3B1', 'T3T1', 'T3W1'].includes(model);

export const isModelWithTHP = (model: Model): boolean => ['T3W1'].includes(model);

export const isT3W1 = (model: Model) => model === 'T3W1';
