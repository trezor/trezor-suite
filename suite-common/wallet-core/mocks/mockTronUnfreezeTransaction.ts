import { testMocks } from '@suite-common/test-utils';
import type { Account, WalletAccountTransaction } from '@suite-common/wallet-types';

type MockTronUnfreezeTransactionParams = {
    account: Account;
    unstakeAmount: string;
    blockTime: number;
    resource?: string;
};

export const mockTronUnfreezeTransaction = ({
    account,
    unstakeAmount,
    blockTime,
    resource,
}: MockTronUnfreezeTransactionParams): WalletAccountTransaction =>
    testMocks.getWalletTransaction({
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        txid: `unfreeze${unstakeAmount}`,
        type: 'self',
        amount: '0',
        fee: '0',
        blockTime,
        blockHeight: 70_000_000,
        tronSpecific: {
            contractType: 'UnfreezeBalanceV2Contract',
            unstakeAmount,
            resource,
        },
    });
