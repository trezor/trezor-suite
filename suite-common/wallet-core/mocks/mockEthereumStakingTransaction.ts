import { testMocks } from '@suite-common/test-utils';
import type { Account, BaseStakeType, WalletAccountTransaction } from '@suite-common/wallet-types';

const METHOD_ID_BY_STAKE_TYPE: Record<BaseStakeType, string> = {
    stake: '0x3a29dbae',
    unstake: '0x76ec871c',
    claim: '0x33986ffa',
};

type MockEthereumStakingTransactionParams = {
    account: Account;
    stakeType: BaseStakeType;
    isPending: boolean;
};

export const mockEthereumStakingTransaction = ({
    account,
    stakeType,
    isPending,
}: MockEthereumStakingTransactionParams): WalletAccountTransaction =>
    testMocks.getWalletTransaction({
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        txid: `0x${stakeType}${isPending ? 'pending' : 'confirmed'}`,
        type: 'sent',
        amount: stakeType === 'stake' ? '500000000000000000' : '0',
        fee: '210000000000000',
        blockHeight: isPending ? 0 : 21_000_000,
        ethereumSpecific: {
            status: isPending ? -1 : 1,
            nonce: 6,
            gasLimit: 300_000,
            parsedData: { methodId: METHOD_ID_BY_STAKE_TYPE[stakeType], name: stakeType },
        },
    });
