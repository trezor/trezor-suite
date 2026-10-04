import { address as addressUtils } from '@trezor/utxo-lib';

import type { AccountType } from './accountType';
import { BITCOIN_NETWORK } from './bitcoinNetwork';
import { deriveAccountScript, parseAccountXpub } from './deriveAccountScript';
import { mockWallet } from '../../mocks/mockWallet';

// The BIP39 test mnemonic "abandon abandon ... about" without a passphrase. Its first addresses
// are published in BIP84 and widely quoted for BIP44 and BIP49.
const TEST_VECTOR_SEED =
    '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';

const wallet = mockWallet(TEST_VECTOR_SEED);

type DeriveAddressParams = {
    accountType: AccountType;
    chain: number;
    addressIndex: number;
};

const deriveAddress = ({ accountType, chain, addressIndex }: DeriveAddressParams) => {
    const accountNode = parseAccountXpub(wallet.getAccountXpub(accountType));
    if (!accountNode.success) throw new Error('test xpub must parse');

    const script = deriveAccountScript({
        accountNode: accountNode.payload,
        accountType,
        chain,
        addressIndex,
    });

    return script.success
        ? addressUtils.fromOutputScript(script.payload, BITCOIN_NETWORK)
        : script.error;
};

describe('deriveAccountScript', () => {
    it.each<[AccountType, number, number, string]>([
        ['p2pkh', 0, 0, '1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA'],
        ['p2sh', 0, 0, '37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf'],
        ['p2wpkh', 0, 0, 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'],
        ['p2wpkh', 0, 1, 'bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g'],
        ['p2wpkh', 1, 0, 'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el'],
    ])(
        'derives the published %s address at chain %i index %i',
        (accountType, chain, addressIndex, address) => {
            expect(deriveAddress({ accountType, chain, addressIndex })).toBe(address);
        },
    );

    it('agrees with the private derivation of the test wallet for every account type', () => {
        (['p2pkh', 'p2sh', 'p2wpkh'] as const).forEach(accountType => {
            expect(deriveAddress({ accountType, chain: 1, addressIndex: 7 })).toBe(
                wallet.getAddress({ accountType, chain: 1, addressIndex: 7 }),
            );
        });
    });

    it.each([
        ['a chain other than receive or change', 2, 0],
        ['a negative index', 0, -1],
        ['a fractional index', 0, 1.5],
        ['a hardened index', 0, 0x80000000],
    ])('refuses %s', (_description, chain, addressIndex) => {
        expect(deriveAddress({ accountType: 'p2pkh', chain, addressIndex })).toBe(
            'invalid-address-path',
        );
    });

    it('refuses an extended key of another network or a private one', () => {
        expect(parseAccountXpub('not a key')).toEqual({ success: false, error: 'invalid-xpub' });
        expect(
            parseAccountXpub(
                'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs',
            ),
        ).toEqual({ success: false, error: 'invalid-xpub' });
    });
});
