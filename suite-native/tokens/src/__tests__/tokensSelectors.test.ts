import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { btcAccount, ethAccount } from '../__fixtures__/accounts';
import { type TokensRootState, selectAccountTokenInfo } from '../tokensSelectors';

describe('tokensSelectors', () => {
    const getState = () =>
        ({
            wallet: {
                accounts: [btcAccount, ethAccount],
            },
        }) as unknown as TokensRootState;

    describe('selectAccountTokenInfo', () => {
        it.each([
            ['0x4d224452801ACEd8B2F0aebE155379bb5D594381'],
            ['0x4d224452801aced8b2f0aebe155379bb5d594381'],
            ['0X4D224452801ACED8B2F0AEBE155379BB5D594381'],
        ])('should return ApeCoin for tokenAddress [%s]', tokenAddressString => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    ethAccount.key,
                    tokenAddressString as TokenAddress,
                ),
            ).toEqual({
                balance: '0',
                contract: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
                decimals: 18,
                name: 'ApeCoin',
                standard: 'ERC20',
                symbol: 'ape',
                transfers: 2,
            });
        });

        it('should return null, when no token was found', () => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    ethAccount.key,
                    'UNKNOWN_TOKEN_ADDRESS' as TokenAddress,
                ),
            ).toBeNull();
        });

        it('should return null, when account was not found', () => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    'UNKNOWN_ACCOUNT_KEY' as AccountKey, // Todo: create properly via `createAccountKey()`
                    '0x4d224452801ACEd8B2F0aebE155379bb5D594381' as TokenAddress,
                ),
            ).toBeNull();
        });
    });
});
