import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TransactionName } from './TransactionName';

// eth mainnet WETH contract + WETH deposit()/withdraw(uint256) calldata (withdraw wad = 1 ETH).
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const DEPOSIT = '0xd0e30db0';
const WITHDRAW = '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000';
const ONE_ETH_WEI = '1000000000000000000';

const wrapTx = {
    symbol: 'eth',
    amount: ONE_ETH_WEI,
    targets: [{ addresses: [WETH] }],
    internalTransfers: [],
    ethereumSpecific: { data: DEPOSIT },
} as unknown as WalletAccountTransaction;

const unwrapTx = {
    symbol: 'eth',
    amount: '0',
    targets: [],
    internalTransfers: [{ from: WETH }],
    ethereumSpecific: { data: WITHDRAW },
} as unknown as WalletAccountTransaction;

describe('TransactionName - WETH wrap/unwrap label', () => {
    it('labels a wrap with the native symbol and the wrapped amount', () => {
        const { getByText } = renderWithStoreProvider(
            <TransactionName transaction={wrapTx} isPending={false} />,
        );

        expect(getByText('Wrap ETH into 1 WETH')).toBeTruthy();
    });

    it('labels an unwrap with the wrapped amount and the native symbol', () => {
        const { getByText } = renderWithStoreProvider(
            <TransactionName transaction={unwrapTx} isPending={false} />,
        );

        expect(getByText('Unwrap 1 WETH into ETH')).toBeTruthy();
    });
});
