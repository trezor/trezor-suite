import { validatePath } from '@trezor/connect-common/src/utils/pathUtils';
import { getBitcoinNetworkOrThrow } from '@trezor/connect-core/src/data/coinInfo';

import { getPublicKeyLabel } from './getPublicKey';

const bitcoin = getBitcoinNetworkOrThrow('btc');

describe('getPublicKeyLabel', () => {
    it.each([
        ["m/84'/0'/0'", bitcoin, 'Export public key of Bitcoin native segwit account #1'],
        ["m/44'/0'/1'", bitcoin, 'Export public key of Bitcoin legacy account #2'],
        ["m/48'/0'/0'/2'", bitcoin, 'Export public key of Bitcoin multisig account #1'],
        ["m/44'/60'/0'", undefined, 'Export public key of Ethereum account #1'],
        ["m/45342'/44'/0'/0'", bitcoin, 'Export Copay ID of legacy account #1'],
        ["m/84'", bitcoin, 'Export public key'],
    ] as const)('titles the public key of %s', (path, coinInfo, title) => {
        expect(
            getPublicKeyLabel({ path: validatePath(path), coinInfo, coinName: 'Ethereum' }),
        ).toBe(title);
    });
});
