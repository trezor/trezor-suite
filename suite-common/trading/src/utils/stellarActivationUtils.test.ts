import type { CryptoId } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount, networkSpecificDefaultStellar } from '@suite-common/wallet-types/mocks';
import type { TokenInfo } from '@trezor/blockchain-link-types';

import { getInactiveStellarReceiveToken } from './stellarActivationUtils';

const usdcContract = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const usdcCryptoId = `stellar--${usdcContract}` as CryptoId;

const usdcToken: TokenInfo = {
    standard: 'STELLAR-CLASSIC',
    contract: usdcContract,
    symbol: 'USDC',
    decimals: 7,
    balance: '10',
};

const createStellarAccount = (tokens: TokenInfo[]) =>
    mockWalletAccount({ symbol: asNetworkSymbol('xlm'), tokens }, networkSpecificDefaultStellar);

describe('getInactiveStellarReceiveToken', () => {
    it('returns the receive token when the account has no trustline for it', () => {
        expect(
            getInactiveStellarReceiveToken({
                account: createStellarAccount([]),
                receiveCryptoId: usdcCryptoId,
            }),
        ).toEqual({ contract: usdcContract, symbol: 'USDC' });
    });

    it('returns undefined when the account already holds the token', () => {
        expect(
            getInactiveStellarReceiveToken({
                account: createStellarAccount([usdcToken]),
                receiveCryptoId: usdcCryptoId,
            }),
        ).toBeUndefined();
    });

    it('returns undefined when receiving native XLM', () => {
        expect(
            getInactiveStellarReceiveToken({
                account: createStellarAccount([]),
                receiveCryptoId: 'stellar' as CryptoId,
            }),
        ).toBeUndefined();
    });

    it('returns undefined when the receive token is not on Stellar', () => {
        expect(
            getInactiveStellarReceiveToken({
                account: createStellarAccount([]),
                receiveCryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            }),
        ).toBeUndefined();
    });

    it('returns undefined when the receive account is not a Stellar account', () => {
        expect(
            getInactiveStellarReceiveToken({
                account: mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
                receiveCryptoId: usdcCryptoId,
            }),
        ).toBeUndefined();
    });

    it('returns undefined without an account or receive asset', () => {
        expect(
            getInactiveStellarReceiveToken({ account: undefined, receiveCryptoId: usdcCryptoId }),
        ).toBeUndefined();
        expect(
            getInactiveStellarReceiveToken({
                account: createStellarAccount([]),
                receiveCryptoId: undefined,
            }),
        ).toBeUndefined();
    });
});
