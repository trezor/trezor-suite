import { Model } from '@trezor/trezor-user-env-link/src/types';

export class ModelFixture {
    isModelWithSecureElement = () => ['T3B1', 'T3T1', 'T3W1'].includes(this.model);
    isModelWithTHP = () => ['T3W1'].includes(this.model);
    isT3W1 = () => this.model === 'T3W1';

    constructor(readonly model: Model) {}
}
