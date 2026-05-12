import { address, compileTransaction, parseBase64RpcAccount } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS, decodeStakeStateAccount } from '@solana-program/stake';

import { BigNumber } from '@trezor/utils';

import { SOL_COMPUTE_UNIT_LIMIT, SOL_COMPUTE_UNIT_PRICE, StakeState } from '../constants';
import type {
    AccountInfoBase,
    AccountInfoWithBase64EncodedData,
    Base58EncodedBytes,
    CompilableTransactionMessage,
    Fee,
    Lamports,
    PrepareClaimSolTxParams,
    PrepareStakeSolTxParams,
    PrepareStakeSolTxResponse,
    Rpc,
    RpcMainnet,
    SolanaRpcApiMainnet,
    SolanaStakingAccount,
    StakeStateAccount,
    StakeStateV2,
    TransactionMessageWithBlockhashLifetime,
} from '../types';
import { claim, createTransactionShimCommon, stake, unstake } from './transactions';

const FILTER_DATA_SIZE = 200n;
const FILTER_OFFSET = 44n;

const EVERSTAKE_VOTER_PUBKEYS = [
    '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF', // mainnet
    'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN', // devnet
];

/** @see {@link file://./../../../../suite-common/wallet-constants/src/stakingConstants.ts}  */
const WALLET_SDK_SOURCE = '1';

export const isStake = (state: StakeStateV2): state is Extract<StakeStateV2, { __kind: 'Stake' }> =>
    state.__kind === 'Stake';

export const stakeAccountState = (account: StakeStateAccount, currentEpoch: bigint): string => {
    const { state } = account;

    if (!isStake(state)) {
        return StakeState.Inactive;
    }

    const { activationEpoch, deactivationEpoch } = state.fields[1].delegation;

    if (activationEpoch > currentEpoch) {
        return StakeState.Inactive;
    }
    if (activationEpoch === currentEpoch) {
        // if you activate then deactivate in the same epoch,
        // deactivationEpoch === activationEpoch.
        // if you deactivate then activate again in the same epoch,
        // the deactivationEpoch will be reset to EPOCH_MAX
        if (deactivationEpoch === activationEpoch) return StakeState.Inactive;

        return StakeState.Activating;
    }
    // activationEpoch < currentEpochBN
    if (deactivationEpoch > currentEpoch) return StakeState.Active;
    if (deactivationEpoch === currentEpoch) return StakeState.Deactivating;

    return StakeState.Deactivated;
};

export const getDelegations = async (
    rpc: RpcMainnet<SolanaRpcApiMainnet> | Rpc<SolanaRpcApiMainnet>,
    descriptor: string,
) => {
    try {
        const accounts = await rpc
            .getProgramAccounts(STAKE_PROGRAM_ADDRESS, {
                encoding: 'base64',
                filters: [
                    {
                        dataSize: FILTER_DATA_SIZE, // Token account size
                    },
                    {
                        memcmp: {
                            bytes: descriptor as Base58EncodedBytes,
                            encoding: 'base58',
                            offset: FILTER_OFFSET,
                        },
                    },
                ],
            })
            .send();

        return accounts.map(account => {
            const parsedAccount = parseBase64RpcAccount(account.pubkey, account.account);

            return decodeStakeStateAccount(parsedAccount);
        });
    } catch {
        throw new Error('Failed to fetch delegations');
    }
};

export const getSolanaStakingData = async (
    rpc: RpcMainnet<SolanaRpcApiMainnet> | Rpc<SolanaRpcApiMainnet>,
    descriptor: string,
    epoch: number,
    stakingProvider: 'all' | 'everstake' | 'non-everstake' = 'all',
): Promise<SolanaStakingAccount[]> => {
    const stakingAccounts = await getDelegations(rpc, descriptor);

    return stakingAccounts
        .map(account => {
            const stakeAccount = account?.data;
            if (!stakeAccount) return;

            const stakeState = stakeAccountState(stakeAccount, BigInt(epoch));

            const { state } = account?.data ?? {};
            if (!isStake(state)) return;

            if (state && 'fields' in state) {
                const { fields } = state;

                const voterPubkey = fields[1]?.delegation?.voterPubkey;
                const isEverStake = EVERSTAKE_VOTER_PUBKEYS.includes(voterPubkey);
                if (stakingProvider === 'everstake' && !isEverStake) return;
                if (stakingProvider === 'non-everstake' && isEverStake) return;

                return {
                    rentExemptReserve: fields[0]?.rentExemptReserve.toString(),
                    stake: fields[1]?.delegation?.stake.toString(),
                    status: stakeState,
                    isEverStake,
                    voterPubkey,
                };
            }
        })
        .filter(account => account !== undefined);
};

const transformTx = (
    tx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
) => {
    const compilableTx = compileTransaction(tx);

    return createTransactionShimCommon(compilableTx);
};

// Type guard to check if transaction is of type CompilableTransactionMessage
function isCompilableTransactionMessage(
    tx: TransactionMessageWithBlockhashLifetime | CompilableTransactionMessage,
): tx is CompilableTransactionMessage {
    return (tx as CompilableTransactionMessage).feePayer !== undefined;
}

const getStakingParams = (estimatedFee?: Fee) =>
    !estimatedFee || !estimatedFee.feePerUnit || !estimatedFee.feeLimit
        ? {
              computeUnitPrice: BigInt(SOL_COMPUTE_UNIT_PRICE),
              computeUnitLimit: SOL_COMPUTE_UNIT_LIMIT,
          }
        : {
              computeUnitPrice: BigInt(estimatedFee.feePerUnit),
              computeUnitLimit: Number(estimatedFee.feeLimit), // solana package expects number
          };

const toLamports = (amount: string) => {
    const bAmount = new BigNumber(amount || '0');

    return bAmount.isNaN() ? '-1' : bAmount.times(10 ** 9).toString(10);
};

export const prepareStakeSolTx = async ({
    from,
    amount,
    connection,
    validator,
    estimatedFee,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = toLamports(amount);
        const params = getStakingParams(estimatedFee);
        const tx = await stake({
            connection,
            validator,
            sender: from,
            lamports: BigInt(lamports),
            source: WALLET_SDK_SOURCE,
            params,
        });

        const { stakeTx } = tx;

        if (!isCompilableTransactionMessage(stakeTx)) {
            throw new Error('Transaction is not compilable');
        }

        const txShim = transformTx(stakeTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareUnstakeSolTx = async ({
    from,
    amount,
    connection,
    estimatedFee,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = toLamports(amount);
        const params = getStakingParams(estimatedFee);
        const tx = await unstake({
            connection,
            sender: from,
            lamports: BigInt(lamports),
            source: WALLET_SDK_SOURCE,
            params,
        });
        const txShim = transformTx(tx.unstakeTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareClaimSolTx = async ({
    from,
    connection,
    estimatedFee,
}: PrepareClaimSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const params = getStakingParams(estimatedFee);
        const tx = await claim({
            connection,
            sender: from,
            params,
        });
        const txShim = transformTx(tx.claimTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

type StakeAccountInfo = {
    data: [string, 'base64'];
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: string;
    space: number;
};

type StakeAccountWithKey = {
    account: StakeAccountInfo;
    pubkey: string;
};

const toRpcAccount = (
    account: StakeAccountInfo,
): AccountInfoBase & { rentEpoch: bigint } & AccountInfoWithBase64EncodedData => ({
    data: account.data as AccountInfoWithBase64EncodedData['data'],
    executable: account.executable,
    lamports: BigInt(account.lamports) as Lamports,
    owner: address(account.owner),
    rentEpoch: BigInt(account.rentEpoch ?? 0),
    space: BigInt(account.space ?? 0),
});

export const decodeStakeResponses = (accountWithKey: StakeAccountWithKey) => {
    const parsed = parseBase64RpcAccount(
        address(accountWithKey.pubkey),
        toRpcAccount(accountWithKey.account),
    );
    const decoded = decodeStakeStateAccount(parsed);

    return {
        account: accountWithKey.pubkey,
        decoded: decoded.data,
    };
};
