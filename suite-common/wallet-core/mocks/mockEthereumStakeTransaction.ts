import { testMocks } from '@suite-common/test-utils';
import type { Account, WalletAccountTransaction } from '@suite-common/wallet-types';

const STAKE_METHOD_ID = '0x3a29dbae';

type MockEthereumStakeTransactionParams = {
    account: Account;
    isPending: boolean;
};

export const mockEthereumStakeTransaction = ({
    account,
    isPending,
}: MockEthereumStakeTransactionParams): WalletAccountTransaction =>
    testMocks.getWalletTransaction({
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        txid: `0x${isPending ? 'pending' : 'confirmed'}stake`,
        type: 'sent',
        amount: '500000000000000000',
        fee: '210000000000000',
        blockHeight: isPending ? 0 : 21_000_000,
        ethereumSpecific: {
            status: isPending ? -1 : 1,
            nonce: 6,
            gasLimit: 300_000,
            parsedData: { methodId: STAKE_METHOD_ID, name: 'Stake' },
        },
    });
