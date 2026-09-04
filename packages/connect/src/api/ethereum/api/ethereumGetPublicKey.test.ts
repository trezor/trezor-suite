import { default as EthereumGetPublicKeyBase } from './ethereumGetPublicKey';

class EthereumGetPublicKey extends EthereumGetPublicKeyBase {
    getParams() {
        return this.params;
    }
}

// Minimal MethodMessage that exercises only the constructor's param validation.
const createMethodParams = (path: string) =>
    new EthereumGetPublicKey({
        payload: { method: 'ethereumGetPublicKey', path },
    }).getParams();

describe('api/ethereum/ethereumGetPublicKey', () => {
    describe('path validation (validatePath length)', () => {
        it('accepts a full BIP44 Ethereum path and resolves the network', () => {
            const params = createMethodParams("m/44'/60'/0'");

            expect(params).toHaveLength(1);
            expect(params[0]?.network?.shortcut).toBe('ETH');
        });

        // The method now validates with length 1 (previously 3), so partial paths that
        // used to throw "Not a valid path" are accepted.
        it('accepts a two-element path and still resolves the network from the slip44 part', () => {
            const params = createMethodParams("m/44'/60'");

            expect(params).toHaveLength(1);
            // slip44 lives at path[1], so the network still resolves.
            expect(params[0]?.network?.shortcut).toBe('ETH');
        });

        it('accepts a single-element path (network is undefined, no slip44 part)', () => {
            const params = createMethodParams("m/44'");

            expect(params).toHaveLength(1);
            expect(params[0]?.network).toBeUndefined();
        });

        it('still rejects an empty path (shorter than the required length of 1)', () => {
            expect(() => createMethodParams('m')).toThrow(/Not a valid path/);
        });
    });
});
