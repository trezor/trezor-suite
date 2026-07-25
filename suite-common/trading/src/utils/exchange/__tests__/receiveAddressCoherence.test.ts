import { type CryptoId } from 'invity-api';

import { isAddressValid } from '@trezor/address-validator';

import { isReceiveAddressCoherent, isReceiveAddressValid } from '../receiveAddressCoherence';

jest.mock('@trezor/address-validator', () => {
    const actual = jest.requireActual('@trezor/address-validator');

    return {
        __esModule: true,
        ...actual,
        isAddressValid: jest.fn(actual.isAddressValid),
    };
});

// Vitalik's address, all lowercase so no EIP-55 checksum is required.
const VALID_ETH_ADDRESS = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';

const ETH_CRYPTO_ID = 'ethereum' as CryptoId;
const BTC_CRYPTO_ID = 'bitcoin' as CryptoId;

describe('isReceiveAddressValid', () => {
    it('returns false instead of throwing when the validator throws', () => {
        (isAddressValid as jest.Mock).mockImplementationOnce(() => {
            throw new Error('validator blew up');
        });

        expect(isReceiveAddressValid(VALID_ETH_ADDRESS, 'eth')).toBe(false);
    });
});

describe('isReceiveAddressCoherent', () => {
    it('treats an empty receive address as coherent', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: undefined,
                receiveCryptoId: BTC_CRYPTO_ID,
                receiveAccountKey: 'account-1',
                receiveAccountSymbol: 'eth',
            }),
        ).toBe(true);
    });

    it('returns false when the receive crypto id cannot be resolved to a symbol', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: VALID_ETH_ADDRESS,
                receiveCryptoId: undefined,
                receiveAccountKey: undefined,
                receiveAccountSymbol: undefined,
            }),
        ).toBe(false);
    });

    it('returns false when the address is invalid for the resolved symbol', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: VALID_ETH_ADDRESS,
                receiveCryptoId: BTC_CRYPTO_ID,
                receiveAccountKey: undefined,
                receiveAccountSymbol: undefined,
            }),
        ).toBe(false);
    });

    it('returns true for a valid address without a bound receive account', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: VALID_ETH_ADDRESS,
                receiveCryptoId: ETH_CRYPTO_ID,
                receiveAccountKey: undefined,
                receiveAccountSymbol: undefined,
            }),
        ).toBe(true);
    });

    it('returns true when a bound account symbol matches the resolved receive symbol', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: VALID_ETH_ADDRESS,
                receiveCryptoId: ETH_CRYPTO_ID,
                receiveAccountKey: 'account-1',
                receiveAccountSymbol: 'eth',
            }),
        ).toBe(true);
    });

    it('returns false when a bound account belongs to a different network than the receive asset', () => {
        expect(
            isReceiveAddressCoherent({
                receiveAddress: VALID_ETH_ADDRESS,
                receiveCryptoId: ETH_CRYPTO_ID,
                receiveAccountKey: 'account-1',
                receiveAccountSymbol: 'btc',
            }),
        ).toBe(false);
    });
});
