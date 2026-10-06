import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokensRootState } from '@suite-native/tokens';

import { selectHasAccountOrTokenSpendableBalance } from './selectors';

const ethSymbol = asNetworkSymbol('eth');
const tokenContract = '0x4d224452801aced8b2f0aebe155379bb5d594381' as TokenAddress;

const getState = (account: Account): TokensRootState =>
    ({
        wallet: {
            accounts: [account],
        },
    }) as unknown as TokensRootState;

describe('selectHasAccountOrTokenSpendableBalance', () => {
    it('returns true for a native account with positive available balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            availableBalance: '1',
        });

        expect(selectHasAccountOrTokenSpendableBalance(getState(account), account.key)).toBe(true);
    });

    it('returns false for a native account without available balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            availableBalance: '0',
        });

        expect(selectHasAccountOrTokenSpendableBalance(getState(account), account.key)).toBe(false);
    });

    it('returns true for a token with positive balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            availableBalance: '0',
            tokens: [
                mockAccountToken({
                    contract: tokenContract,
                    balance: '1',
                }),
            ],
        });

        expect(
            selectHasAccountOrTokenSpendableBalance(getState(account), account.key, tokenContract),
        ).toBe(true);
    });

    it('returns false for a token without balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            availableBalance: '1',
            tokens: [
                mockAccountToken({
                    contract: tokenContract,
                    balance: '0',
                }),
            ],
        });

        expect(
            selectHasAccountOrTokenSpendableBalance(getState(account), account.key, tokenContract),
        ).toBe(false);
    });

    it('returns false when the selected token is missing', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            availableBalance: '1',
            tokens: [],
        });

        expect(
            selectHasAccountOrTokenSpendableBalance(getState(account), account.key, tokenContract),
        ).toBe(false);
    });
});
