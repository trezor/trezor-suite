import {
    address,
    compileTransactionMessage,
    createAddressWithSeed,
    createNoopSigner,
    createTransactionMessage,
    parseBase64RpcAccount,
    pipe,
    prependTransactionMessageInstruction,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import {
    SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR,
    SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR,
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitLimitInstructionDataDecoder,
    getSetComputeUnitPriceInstruction,
    getSetComputeUnitPriceInstructionDataDecoder,
} from '@solana-program/compute-budget';
import {
    STAKE_PROGRAM_ADDRESS,
    decodeStakeStateAccount,
    getInitializeInstruction,
    getSplitInstruction,
} from '@solana-program/stake';
import {
    getAllocateWithSeedInstruction,
    getCreateAccountWithSeedInstruction,
    getTransferSolInstruction,
} from '@solana-program/system';

import { BigNumber } from '@trezor/utils';

import {
    COMPUTE_BUDGET_PROGRAM_ID,
    SOL_BASE_FEE,
    SOL_COMPUTE_UNIT_LIMIT,
    SOL_COMPUTE_UNIT_PRICE,
    SOL_MICROLAMPORTS_PER_LAMPORT,
    STAKE_ACCOUNT_V2_SIZE,
    StakeState,
} from '../constants';
import type {
    Address,
    Base58EncodedBytes,
    Blockhash,
    Connection,
    Fee,
    Instruction,
    LegacyCompiledTransactionMessage,
    Params,
    Rpc,
    RpcMainnet,
    SolanaRpcApiMainnet,
    StakeStateAccount,
    StakeStateV2,
    Transaction,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionWithLifetime,
    TransactionWithinSizeLimit,
    V0CompiledTransactionMessage,
} from '../types';

const FILTER_DATA_SIZE = 200n;
const FILTER_OFFSET = 44n;

const ADDRESS_DEFAULT = address('11111111111111111111111111111111');

const formatEverstakeSource = (source: string): string => {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
};

export const createAccountWithSeedTx = async (
    authorityPublicKey: Address,
    lamports: bigint,
    source: string,
): Promise<[Instruction, Instruction, Address]> => {
    // Format source to
    const seed = formatEverstakeSource(source || '');

    const stakeAccountPubkey = await createAddressWithSeed({
        baseAddress: authorityPublicKey,
        programAddress: STAKE_PROGRAM_ADDRESS,
        seed,
    });

    const createAccountInstruction = getCreateAccountWithSeedInstruction({
        payer: createNoopSigner(authorityPublicKey),
        newAccount: stakeAccountPubkey,
        baseAccount: createNoopSigner(authorityPublicKey),
        base: address(authorityPublicKey),
        seed,
        amount: lamports,
        space: STAKE_ACCOUNT_V2_SIZE,
        programAddress: STAKE_PROGRAM_ADDRESS,
    });

    const initializeInstruction = getInitializeInstruction(
        /** Uninitialized stake account */
        {
            stake: stakeAccountPubkey,
            arg0: {
                staker: authorityPublicKey,
                withdrawer: authorityPublicKey,
            },
            arg1: {
                unixTimestamp: 0,
                epoch: 0,
                custodian: ADDRESS_DEFAULT,
            },
        },
    );

    return [createAccountInstruction, initializeInstruction, stakeAccountPubkey];
};

export const baseTx = async (
    connection: Connection,
    sender: string,
    params?: Params<Blockhash>,
): Promise<
    TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
> => {
    const finalLatestBlockhash =
        params?.finalLatestBlockhash || (await connection.getLatestBlockhash().send()).value;

    let transactionMessage: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayer(address(sender), tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
    );

    if (params?.computeUnitLimit !== undefined && params?.computeUnitLimit > 0) {
        const unitLimitInstruction = getSetComputeUnitLimitInstruction({
            /** Transaction compute unit limit used for prioritization fees. */
            units: params?.computeUnitLimit,
        });

        transactionMessage = prependTransactionMessageInstruction(
            unitLimitInstruction,
            transactionMessage,
        );
    }

    if (params?.computeUnitPrice !== undefined && params?.computeUnitPrice > 0) {
        const unitPriceInstruction = getSetComputeUnitPriceInstruction({
            /** Transaction compute unit price used for prioritization fees. */
            microLamports: params?.computeUnitPrice,
        });
        transactionMessage = prependTransactionMessageInstruction(
            unitPriceInstruction,
            transactionMessage,
        );
    }

    return transactionMessage;
};

export const getFeeSummary = (
    transactionMessage: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime,
) => {
    const compiledMessage = compileTransactionMessage(transactionMessage) as
        | LegacyCompiledTransactionMessage
        | V0CompiledTransactionMessage;

    const baseFeeLamports = SOL_BASE_FEE * BigInt(compiledMessage.header.numSignerAccounts);

    let unitLimit = BigInt(SOL_COMPUTE_UNIT_LIMIT);
    let unitPriceMicroLamports = 0n;
    let isUnitLimitSet = false;
    let isUnitPriceSet = false;

    compiledMessage.instructions.forEach(instruction => {
        if (
            compiledMessage.staticAccounts[instruction.programAddressIndex] !==
            COMPUTE_BUDGET_PROGRAM_ID
        ) {
            return;
        }

        const { data } = instruction;
        if (!data || data.length === 0) return;

        if (data[0] === SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR && !isUnitLimitSet) {
            const decoded = getSetComputeUnitLimitInstructionDataDecoder().decode(data);
            unitLimit = BigInt(decoded.units);
            isUnitLimitSet = true;

            return;
        }

        if (data[0] === SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR && !isUnitPriceSet) {
            const decoded = getSetComputeUnitPriceInstructionDataDecoder().decode(data);
            unitPriceMicroLamports = BigInt(decoded.microLamports);
            isUnitPriceSet = true;
        }
    });

    const priorityFeeLamports =
        (unitPriceMicroLamports * BigInt(unitLimit) + SOL_MICROLAMPORTS_PER_LAMPORT - 1n) /
        SOL_MICROLAMPORTS_PER_LAMPORT;

    const feeLamports = baseFeeLamports + priorityFeeLamports;

    return {
        baseFeeLamports: baseFeeLamports.toString(10),
        priorityFeeLamports: priorityFeeLamports.toString(10),
        feeLamports: feeLamports.toString(10),
    };
};

export const timestampInSec = (): number => (Date.now() / 1000) | 0;

export const isLockupInForce = (
    account: StakeStateAccount,
    currEpoch: bigint,
    currUnixTimestamp: bigint,
): boolean => {
    if (account.state.__kind !== 'Stake' && account.state.__kind !== 'Initialized') {
        return false;
    }

    const { unixTimestamp, epoch } = account.state.fields[0].lockup;

    return unixTimestamp > currUnixTimestamp || epoch > currEpoch;
};

export const split = async (
    authorityPublicKey: Address,
    lamports: bigint,
    oldStakeAccountPubkey: Address,
    source: string,
    rentExemptReserve?: bigint,
): Promise<[Array<Instruction>, Address]> => {
    // Format source to
    const seed = formatEverstakeSource(source);

    const newStakeAccountPubkey = await createAddressWithSeed({
        baseAddress: authorityPublicKey,
        programAddress: STAKE_PROGRAM_ADDRESS,
        seed,
    });

    const instructions: Array<Instruction> = [];

    const allocateWithSeedInstruction = getAllocateWithSeedInstruction({
        newAccount: newStakeAccountPubkey,
        baseAccount: createNoopSigner(address(authorityPublicKey)),
        base: authorityPublicKey,
        seed,
        space: STAKE_ACCOUNT_V2_SIZE,
        programAddress: STAKE_PROGRAM_ADDRESS,
    });

    instructions.push(allocateWithSeedInstruction);

    // If creates new account need to top up balance by rent amount
    if (rentExemptReserve && rentExemptReserve > 0) {
        const rentTransferInstruction = getTransferSolInstruction({
            source: createNoopSigner(authorityPublicKey),
            destination: newStakeAccountPubkey,
            amount: rentExemptReserve,
        });
        instructions.push(rentTransferInstruction);
    }

    const splitInstruction = getSplitInstruction({
        stake: oldStakeAccountPubkey,
        splitStake: newStakeAccountPubkey,
        stakeAuthority: createNoopSigner(authorityPublicKey),
        args: lamports,
    });

    instructions.push(splitInstruction);

    return [instructions, newStakeAccountPubkey];
};

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

// Type guard to check if a value is a transaction message with a fee payer (vs a compiled Transaction)
export function isCompilableTransactionMessage(
    tx:
        | (TransactionMessage &
              TransactionMessageWithFeePayer &
              TransactionMessageWithBlockhashLifetime)
        | (Transaction & TransactionWithinSizeLimit & TransactionWithLifetime),
): tx is TransactionMessage &
    TransactionMessageWithFeePayer &
    TransactionMessageWithBlockhashLifetime {
    return (tx as TransactionMessageWithFeePayer).feePayer !== undefined;
}

export const getStakingParams = (estimatedFee?: Fee) =>
    !estimatedFee?.feePerUnit || !estimatedFee.feeLimit
        ? {
              computeUnitPrice: BigInt(SOL_COMPUTE_UNIT_PRICE),
              computeUnitLimit: SOL_COMPUTE_UNIT_LIMIT,
          }
        : {
              computeUnitPrice: BigInt(estimatedFee.feePerUnit),
              computeUnitLimit: Number(estimatedFee.feeLimit), // solana package expects number
          };

export const toLamports = (amount: string) => {
    const bAmount = new BigNumber(amount || '0');

    return bAmount.isNaN() ? '-1' : bAmount.times(10 ** 9).toString(10);
};
