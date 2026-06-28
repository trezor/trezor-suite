import * as enabledNetworksStore from '../../data/enabledNetworksStore';
import { AbstractMethod, type MethodContext, type MethodReturnType } from '../AbstractMethod';

// Minimal concrete subclass. The Cardano enablement guard runs in `resolveCardanoCapability()`
// (the real device-call path), NOT the constructor — so constructing the method (and the `__info`
// introspection that uses it) never throws, even when the network isn't enabled.
class TestMethod extends AbstractMethod<any> {
    get requiredPermissions() {
        return [];
    }

    run(_context: MethodContext): Promise<MethodReturnType<any>> {
        return Promise.resolve(undefined as any);
    }
}

const make = (method: string, params: Record<string, unknown> = {}) =>
    new TestMethod({ payload: { method, ...params } } as any, undefined);

const resolved = (method: string, params: Record<string, unknown> = {}) => {
    const m = make(method, params);
    m.resolveCardanoCapability();

    return m;
};

describe('AbstractMethod Cardano enablement', () => {
    // Reset the singleton between tests.
    afterEach(() => {
        enabledNetworksStore.set([]);
    });

    describe('constructor never blocks (keeps `__info` introspection working when not enabled)', () => {
        it('constructing a cardano* method with the store empty does not throw', () => {
            expect(() => make('cardanoGetAddress')).not.toThrow();
        });

        it('constructing a coin-targeting method with the store empty does not throw', () => {
            expect(() => make('getAccountInfo', { coin: 'ada' })).not.toThrow();
        });

        it('useCardanoDerivation defaults to false before resolveCardanoCapability()', () => {
            expect(make('cardanoGetAddress').useCardanoDerivation).toBe(false);
        });
    });

    describe("resolveCardanoCapability rejects Cardano-bound calls while neither 'ada' nor 'tada' is enabled", () => {
        it('cardano* method name', () => {
            expect(() => make('cardanoGetAddress').resolveCardanoCapability()).toThrow(
                "requires 'ada' in enabled networks",
            );
        });

        it('payload coin references ada', () => {
            expect(() =>
                make('getAccountInfo', { coin: 'ada' }).resolveCardanoCapability(),
            ).toThrow("requires 'ada' in enabled networks");
        });

        it('payload coin references ada case-insensitively', () => {
            expect(() =>
                make('getAccountInfo', { coin: 'ADA' }).resolveCardanoCapability(),
            ).toThrow();
        });

        it('a bundle coins entry references a Cardano symbol', () => {
            expect(() =>
                make('discoverAccounts', {
                    coins: [{ symbol: 'btc' }, { symbol: 'tada' }],
                }).resolveCardanoCapability(),
            ).toThrow();
        });

        it('a bundle[].coin entry references a Cardano coin (bundlify runs after the guard)', () => {
            expect(() =>
                make('getAccountInfo', {
                    bundle: [{ coin: 'btc' }, { coin: 'ada' }],
                }).resolveCardanoCapability(),
            ).toThrow("requires 'ada' in enabled networks");
        });

        it('the thrown error carries the Method_NetworkNotEnabled code', () => {
            try {
                make('cardanoSignTransaction').resolveCardanoCapability();
                throw new Error('expected guard to throw');
            } catch (error: any) {
                expect(error.code).toBe('Method_NetworkNotEnabled');
            }
        });
    });

    describe("resolveCardanoCapability allows calls once 'ada' is enabled", () => {
        beforeEach(() => {
            enabledNetworksStore.set([{ coin: 'ada' }]);
        });

        it('cardano* method enables derivation', () => {
            expect(resolved('cardanoGetAddress').useCardanoDerivation).toBe(true);
        });

        it('payload coin ada enables derivation', () => {
            expect(resolved('getAccountInfo', { coin: 'ada' }).useCardanoDerivation).toBe(true);
        });

        it('derivation is on for any method once ada is declared (driven by the store)', () => {
            expect(resolved('getPublicKey').useCardanoDerivation).toBe(true);
        });
    });

    describe("'tada' (Cardano testnet) is symmetric with 'ada'", () => {
        it("enabling only 'tada' allows a tada-bound call", () => {
            enabledNetworksStore.set([{ coin: 'tada' }]);
            expect(resolved('getAccountInfo', { coin: 'tada' }).useCardanoDerivation).toBe(true);
        });

        it("enabling only 'tada' allows an ada-bound call (both drive derive_cardano)", () => {
            enabledNetworksStore.set([{ coin: 'tada' }]);
            expect(resolved('cardanoGetAddress').useCardanoDerivation).toBe(true);
        });

        it("enabling only 'ada' allows a tada-bound call", () => {
            enabledNetworksStore.set([{ coin: 'ada' }]);
            expect(resolved('getAccountInfo', { coin: 'tada' }).useCardanoDerivation).toBe(true);
        });
    });

    describe('leaves non-Cardano calls untouched', () => {
        it('does not throw and keeps derivation off when ada is not enabled', () => {
            expect(resolved('getAccountInfo', { coin: 'btc' }).useCardanoDerivation).toBe(false);
        });

        it('ignores non-Cardano coins in a bundle', () => {
            const method = resolved('discoverAccounts', {
                coins: [{ symbol: 'btc' }, { symbol: 'eth' }],
            });
            expect(method.useCardanoDerivation).toBe(false);
        });
    });
});
