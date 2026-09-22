import { type CallMethodPayload } from './events/call';
import { methodUsesDevice } from './methodUsesDevice';

const call = (params: CallMethodPayload) => methodUsesDevice(params);

describe('methodUsesDevice', () => {
    it('is false for methods that only talk to a backend', () => {
        expect(call({ method: 'getSettings' })).toBe(false);
    });

    it('is true for anything not listed as backend-only', () => {
        expect(call({ method: 'getFeatures' })).toBe(true);
    });

    describe('getAccountInfo', () => {
        it('is false when a descriptor makes device derivation unnecessary', () => {
            expect(call({ method: 'getAccountInfo', coin: 'btc', descriptor: 'xpub' })).toBe(false);
        });

        it('is true when only a path is given', () => {
            expect(call({ method: 'getAccountInfo', coin: 'btc', path: "m/84'/0'/0'" })).toBe(true);
        });

        it('is true when any batch of a bundle needs the device', () => {
            expect(
                call({
                    method: 'getAccountInfo',
                    bundle: [
                        { coin: 'btc', path: "m/84'/0'/0'" },
                        { coin: 'btc', path: "m/84'/0'/1'", descriptor: 'xpub' },
                    ],
                }),
            ).toBe(true);
        });

        it('is false when every batch of a bundle carries a descriptor', () => {
            expect(
                call({
                    method: 'getAccountInfo',
                    bundle: [
                        { coin: 'btc', path: "m/84'/0'/0'", descriptor: 'xpub' },
                        { coin: 'btc', descriptor: 'xpub2' },
                    ],
                }),
            ).toBe(false);
        });
    });

    describe('thpRemoveCredentials', () => {
        it('is false when no device is addressed', () => {
            expect(call({ method: 'thpRemoveCredentials' })).toBe(false);
        });

        it('is true when a device is addressed', () => {
            expect(call({ method: 'thpRemoveCredentials', device: { instance: 1 } })).toBe(true);
        });
    });
});
