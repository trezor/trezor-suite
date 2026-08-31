import { getTxExplorerUrl } from './getExplorerUrls';
import { type Explorer } from './types';

const explorer: Explorer = {
    base: 'https://btc1.trezor.io',
    tx: 'tx',
    address: 'address',
};

describe('getTxExplorerUrl', () => {
    it('builds the transaction page of the explorer', () => {
        expect(getTxExplorerUrl(explorer, 'txid')).toBe('https://btc1.trezor.io/tx/txid');
    });

    it('appends the query string the explorer needs', () => {
        expect(getTxExplorerUrl({ ...explorer, queryString: '?cluster=devnet' }, 'txid')).toBe(
            'https://btc1.trezor.io/tx/txid?cluster=devnet',
        );
    });

    it('has nothing to build without an explorer', () => {
        expect(getTxExplorerUrl(undefined, 'txid')).toBeUndefined();
    });

    // The id can come from a trade provider, so it must not be able to leave the transaction path.
    it('encodes an id that would otherwise alter the path or the query', () => {
        expect(getTxExplorerUrl(explorer, '../../evil?x=1')).toBe(
            'https://btc1.trezor.io/tx/..%2F..%2Fevil%3Fx%3D1',
        );
    });
});
