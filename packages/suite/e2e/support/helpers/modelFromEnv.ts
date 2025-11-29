import { MODELS, Model } from '@trezor/trezor-user-env-link';

export function getModelFromEnv(): Model {
    const envValue = process.env.EMULATOR_MODEL as Model;

    return MODELS.includes(envValue) ? envValue : 'T3T1'; // This effectively sets T3T1 as the default model to be used in tests
}

export function getModelTag(): string {
    const model = getModelFromEnv();

    return `@${model}`;
}
