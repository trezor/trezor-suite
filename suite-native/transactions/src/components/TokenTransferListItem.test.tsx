import { type AccountKey, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';

import { TokenTransferListItemValues } from './TokenTransferListItem';

const ACCOUNT_KEY = 'eth-account-key' as AccountKey;

// Blockbook reports 18 decimals for an ERC-721 contract, which has none.
const erc721Transfer: TypedTokenTransfer = {
    type: 'recv',
    standard: 'ERC721',
    amount: '737',
    decimals: 18,
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    contract: toTokenAddress('0x3333333333333333333333333333333333333333'),
    name: 'XYZ Collection',
    symbol: toTokenSymbol('XYZ'),
};

const erc1155Transfer: TypedTokenTransfer = {
    ...erc721Transfer,
    standard: 'ERC1155',
    amount: '',
    multiTokenValues: [{ id: '44395624018362851188', value: '1' }],
};

const getTransaction = (tokenTransfer: TypedTokenTransfer) =>
    ({
        txid: 'txid',
        symbol: 'eth',
        type: 'recv',
        tokens: [tokenTransfer],
    }) as unknown as WalletAccountTransaction;

// No transactions are stored, so the phishing check has nothing to flag.
const preloadedState = {
    wallet: {
        accounts: [],
        transactions: { transactions: {} },
        settings: { localCurrency: 'usd' },
    },
};

describe('TokenTransferListItemValues', () => {
    it('renders an ERC-721 token ID instead of dividing it by the decimals', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <TokenTransferListItemValues
                tokenTransfer={erc721Transfer}
                transaction={getTransaction(erc721Transfer)}
                accountKey={ACCOUNT_KEY}
            />,
            { preloadedState },
        );

        expect(getByText('XYZ #737')).toBeTruthy();
        expect(queryByText(/0\.000000000000000737/)).toBeNull();
    });

    it('renders an ERC-1155 token ID from its multi-token values', async () => {
        const { getByText } = await renderWithStoreProvider(
            <TokenTransferListItemValues
                tokenTransfer={erc1155Transfer}
                transaction={getTransaction(erc1155Transfer)}
                accountKey={ACCOUNT_KEY}
            />,
            { preloadedState },
        );

        expect(getByText('XYZ #44395624018362851188')).toBeTruthy();
    });
});
