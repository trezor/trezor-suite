import { CoinjoinBackend, constants } from '@trezor/coinjoin';

export class CoinjoinBackendService extends CoinjoinBackend {
    private static instances: Record<string, CoinjoinBackendService> = {};

    private constructor(network: string) {
        if (network !== 'regtest')
            throw new Error('Other coins than REGTEST are currently not supported for CoinJoin');
        super(constants.SLDEV_REGTEST_SETTINGS);
    }

    static getInstance(network: string) {
        if (!this.instances[network]) {
            this.instances[network] = new CoinjoinBackendService(network);
        }
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }
}
