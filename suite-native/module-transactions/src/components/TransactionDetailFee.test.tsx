import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { TransactionDetailFee } from './TransactionDetailFee';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

type TransactionInput = WalletAccountTransaction['details']['vin'][number];

const FOREIGN_PARENT_TXID = 'bb'.repeat(32);

// An incoming payment as the Electrum backend gives it before the previous transaction of its
// input is fetched: the input has no value, so the fee is unknown and stays '0'.
const unresolvedInput: TransactionInput = {
    txid: FOREIGN_PARENT_TXID,
    vout: 1,
    n: 0,
    addresses: [],
    isAddress: false,
};

const resolvedInput: TransactionInput = {
    ...unresolvedInput,
    addresses: ['1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH'],
    isAddress: true,
    value: '21000',
};

type GetIncomingTransactionParams = {
    input: TransactionInput;
    fee: string;
};

const getIncomingTransaction = ({
    input,
    fee,
}: GetIncomingTransactionParams): WalletAccountTransaction => ({
    descriptor: asAccountDescriptor('zpubIncoming'),
    deviceState: '1stTestnetAddress@device_id:0',
    symbol: asNetworkSymbol('btc'),
    type: 'recv',
    txid: 'cc'.repeat(32),
    blockHeight: 100,
    amount: '20000',
    fee,
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [input],
        vout: [
            {
                n: 0,
                addresses: ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
                isAddress: true,
                value: '20000',
            },
        ],
        size: 200,
        totalInput: input.value ?? '0',
        totalOutput: '20000',
    },
});

describe(TransactionDetailFee.name, () => {
    it('tells that the fee is unknown while an input has no value', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <TransactionDetailFee
                transaction={getIncomingTransaction({ input: unresolvedInput, fee: '0' })}
            />,
        );

        expect(getByText(getTranslation('generic.unknown'))).toBeOnTheScreen();
        expect(queryByText(/BTC/)).toBeNull();
    });

    it('shows the fee once every input has its value, like with Blockbook', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <TransactionDetailFee
                transaction={getIncomingTransaction({ input: resolvedInput, fee: '1000' })}
            />,
        );

        expect(getByText(/0\.00001 BTC/)).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.unknown'))).toBeNull();
    });
});
