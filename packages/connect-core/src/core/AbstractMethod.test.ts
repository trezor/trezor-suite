import { AbstractMethod, type MethodContext, type MethodReturnType } from './AbstractMethod';
import * as enabledNetworksStore from '../data/enabledNetworksStore';

// Minimal concrete subclass used to exercise resolveCardanoCapability()'s derivation behavior.
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
        it('keeps derivation off when ada is not enabled', () => {
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

describe('AbstractMethod call status', () => {
    it('runs a pending call and answers it once', () => {
        const method = make('getFeatures');

        expect(method.callStatus).toBe('pending');
        expect(method.startRunning()).toBe(true);
        expect(method.callStatus).toBe('running');
        expect(method.markAnswered()).toBe(true);
        expect(method.markAnswered()).toBe(false);
        expect(method.callStatus).toBe('answered');
    });

    it('does not run a call answered while pending', () => {
        const method = make('getFeatures');

        expect(method.markAnswered()).toBe(true);
        expect(method.startRunning()).toBe(false);
        expect(method.callStatus).toBe('answered');
    });

    it('does not start a running call again', () => {
        const method = make('getFeatures');
        method.startRunning();

        expect(method.startRunning()).toBe(false);
    });
});
