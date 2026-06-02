import { AccountBase } from '../src/account';

type TokenMock = NonNullable<AccountBase['tokens']>[number];

const defaultToken: TokenMock = {
    name: 'default-token-name',
    symbol: 'DTN',
    contract: '0x' + 'f'.repeat(40),
    standard: 'ERC20',
    decimals: 18,
};

export const mockAccountToken = (token: Partial<TokenMock>): TokenMock => ({
    ...defaultToken,
    ...token,
});
