import {
    type AccountKey,
    asAccountDescriptor,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { type StaticSessionId } from '@trezor/connect';

import { TokenTransferListItemValues } from './TokenTransferListItem';

const accountKey = 'account-arb-device' as AccountKey;
const tokenTransfer: TypedTokenTransfer = {
    type: 'sent',
    amount: '20000000000000000000',
    decimals: 18,
    symbol: toTokenSymbol('ARB'),
    contract: toTokenAddress('0x912CE59144191C1204E64559FE8253a0e49E6548'),
    from: 'sender',
    to: 'recipient',
};
const transaction: WalletAccountTransaction = {
    descriptor: asAccountDescriptor('account'),
    deviceState: 'device' as StaticSessionId,
    symbol: 'arb',
    type: 'contract',
    txid: 'test-transaction',
    amount: '0',
    fee: '0',
    targets: [],
    tokens: [tokenTransfer],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
};

type RenderValuesParams = {
    transfer?: Partial<TypedTokenTransfer>;
    isFailed?: boolean;
};
const renderValues = ({ transfer = {}, isFailed = false }: RenderValuesParams = {}) =>
    renderWithStoreProvider(
        <TokenTransferListItemValues
            tokenTransfer={{ ...tokenTransfer, ...transfer }}
            transaction={{ ...transaction, type: isFailed ? 'failed' : 'contract' }}
            accountKey={accountKey}
        />,
        { preloadedState: { wallet: { accounts: [], transactions: { transactions: {} } } } },
    );

describe('TokenTransferListItemValues', () => {
    it.each(['ARB', 'arb', 'ArB', 'eth', 'btc'])('preserves the token ticker %s', async symbol => {
        const { getByTestId } = await renderValues({ transfer: { symbol: toTokenSymbol(symbol) } });

        expect(getByTestId('plain-text')).toHaveTextContent(`-20.00 ${symbol}`);
    });

    it('uses the incoming token direction even when the parent is a contract call', async () => {
        const { getByTestId } = await renderValues({ transfer: { type: 'recv' } });

        expect(getByTestId('plain-text')).toHaveTextContent('+20.00 ARB');
    });

    it.each(['self', 'unknown'] as const)('omits the sign for %s transfers', async type => {
        const { getByTestId } = await renderValues({ transfer: { type } });

        expect(getByTestId('plain-text')).toHaveTextContent(/^20\.00\sARB$/);
    });

    it('omits the sign for failed transfers', async () => {
        const { getByTestId } = await renderValues({ isFailed: true });

        expect(getByTestId('plain-text')).toHaveTextContent(/^20\.00\sARB$/);
    });

    it('keeps long token symbols shortened', async () => {
        const { getByTestId } = await renderValues({
            transfer: { symbol: toTokenSymbol('LongTokenSymbol') },
        });

        expect(getByTestId('plain-text')).toHaveTextContent('-20.00 LongTokenS...');
    });

    it('renders no amount without token symbol metadata', async () => {
        const { queryByTestId } = await renderValues({ transfer: { symbol: undefined } });

        expect(queryByTestId('plain-text')).toBeNull();
    });
});
