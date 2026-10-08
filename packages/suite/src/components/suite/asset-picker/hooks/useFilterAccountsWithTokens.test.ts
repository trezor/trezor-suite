import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import {
    createAccountOption,
    createHiddenTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { type AccountWithOptionalLabel, type AccountWithTokensOption } from '../types';
import { filterAccountsWithTokens } from './useFilterAccountsWithTokens';

const ethSymbol = asNetworkSymbol('eth');

const createAccount = (index: number): AccountWithOptionalLabel =>
    mockWalletAccount({ symbol: ethSymbol, index, descriptor: asAccountDescriptor(`eth${index}`) });

const createToken = (symbol: string, name: string): TokensWithRates => ({
    ...mockAccountToken({ symbol, name, contract: `0x${symbol.toLowerCase()}`, balance: '1' }),
    fiatValue: new BigNumber(0),
});

const firstAccount = createAccount(0);
const secondAccount = createAccount(1);
const usdt = createToken('USDT', 'Tether');
const link = createToken('LINK', 'Chainlink');

const accountsWithTokens: AccountWithTokensOption[] = [
    createAccountOption(firstAccount),
    createTokenOption(firstAccount, usdt),
    createTokenOption(firstAccount, link),
    createAccountOption(secondAccount),
    createTokenOption(secondAccount, link),
];

const accountLabels = ['Ethereum #1', 'Savings'];
const getAccountLabel = (account: AccountWithOptionalLabel) => accountLabels[account.index] ?? '';

const describeItem = (item: AccountWithTokensOption) => {
    switch (item.type) {
        case 'account':
            return `account ${item.account.index}`;
        case 'token':
            return `token ${item.account.index} ${item.token.symbol}`;
        case 'hidden-tokens':
            return `hidden ${item.account.index} ${item.tokens.map(token => token.symbol).join(',')}`;
    }
};

type FilterParams = {
    search: string;
    shouldKeepAccountWithMatchedToken: boolean;
    items?: AccountWithTokensOption[];
};

const filter = ({
    search,
    shouldKeepAccountWithMatchedToken,
    items = accountsWithTokens,
}: FilterParams) =>
    filterAccountsWithTokens({
        accountsWithTokens: items,
        search,
        getAccountLabel,
        shouldKeepAccountWithMatchedToken,
    }).map(describeItem);

describe('filterAccountsWithTokens', () => {
    it('keeps the account row of a matched token when asked to', () => {
        expect(filter({ search: 'usdt', shouldKeepAccountWithMatchedToken: true })).toEqual([
            'account 0',
            'token 0 USDT',
        ]);
    });

    it('lists only the matched token when the account row is not kept', () => {
        expect(filter({ search: 'usdt', shouldKeepAccountWithMatchedToken: false })).toEqual([
            'token 0 USDT',
        ]);
    });

    it.each([
        ['#2', true],
        ['#2', false],
        ['savings', true],
        ['savings', false],
    ])(
        'keeps an account matched by its number or label ("%s") with all of its tokens (keep account row: %s)',
        (search, shouldKeepAccountWithMatchedToken) => {
            expect(filter({ search, shouldKeepAccountWithMatchedToken })).toEqual([
                'account 1',
                'token 1 LINK',
            ]);
        },
    );

    it('narrows hidden tokens to the matched ones', () => {
        const items: AccountWithTokensOption[] = [
            createAccountOption(firstAccount),
            createHiddenTokensOption({
                account: firstAccount,
                hiddenTokens: [usdt, link],
                expandedHiddenTokensGroups: [],
            }),
        ];

        expect(filter({ search: 'usdt', shouldKeepAccountWithMatchedToken: false, items })).toEqual(
            ['hidden 0 USDT'],
        );
        expect(filter({ search: 'usdt', shouldKeepAccountWithMatchedToken: true, items })).toEqual([
            'account 0',
            'hidden 0 USDT',
        ]);
    });
});
