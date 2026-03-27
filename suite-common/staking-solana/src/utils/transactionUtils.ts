import {
    type Account,
    type Address,
    type Blockhash,
    type CompilableTransactionMessage,
    type Instruction,
    type SignatureBytes,
    type Transaction,
    type TransactionMessageWithBlockhashLifetime,
    address,
    appendTransactionMessageInstruction,
    compileTransactionMessage,
    createAddressWithSeed,
    createNoopSigner,
    createTransactionMessage,
    getBase16Codec,
    getTransactionEncoder,
    partiallySignTransactionMessageWithSigners,
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
    type StakeStateAccount,
    getDeactivateInstruction,
    getDelegateStakeInstruction,
    getInitializeInstruction,
    getSplitInstruction,
    getWithdrawInstruction,
} from '@solana-program/stake';
import {
    getAllocateWithSeedInstruction,
    getCreateAccountWithSeedInstruction,
    getTransferSolInstruction,
} from '@solana-program/system';

import { type SolanaTxMeta } from '@suite-common/staking-solana-types';
import {
    SOL_BASE_FEE,
    SOL_COMPUTE_UNIT_LIMIT,
    SOL_MICROLAMPORTS_PER_LAMPORT,
} from '@suite-common/wallet-constants';
import { COMPUTE_BUDGET_PROGRAM_ID } from '@trezor/blockchain-link-solana/src/solanaUtils';
import { StakeState } from '@trezor/blockchain-link-solana/src/types';
import {
    STAKE_ACCOUNT_V2_SIZE,
    getDelegations,
    isStake,
    stakeAccountState,
} from '@trezor/blockchain-link-solana/src/utils/stakingAccounts';
import { serializeError } from '@trezor/utils';

import { selectSolanaWalletSdkNetwork } from '../connection';
import {
    ADDRESS_DEFAULT,
    MAX_CLAIM_ACCOUNTS,
    MAX_DEACTIVATE_ACCOUNTS,
    MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
    MIN_AMOUNT,
    STAKE_CONFIG_ACCOUNT,
    STAKE_HISTORY_ACCOUNT,
} from '../constants';
import {
    type ClaimParams,
    type ClaimResponse,
    type Connection,
    type Delegations,
    type Params,
    type StakeParams,
    type StakeResponse,
    type UnstakeResponse,
} from '../types';

const formatEverstakeSource = (source: string): string => {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
};

const createAccountWithSeedTx = async (
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

const baseTx = async (
    connection: Connection,
    sender: string,
    params?: Params<Blockhash>,
): Promise<CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime> => {
    const finalLatestBlockhash =
        params?.finalLatestBlockhash || (await connection.getLatestBlockhash().send()).value;

    let transactionMessage: CompilableTransactionMessage = pipe(
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

export const getFeeSummary = ({
    transactionMessage,
}: {
    transactionMessage: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;
}) => {
    const compiledMessage = compileTransactionMessage(transactionMessage);

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

const timestampInSec = (): number => (Date.now() / 1000) | 0;

const isLockupInForce = (
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

const split = async (
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

export const stake = async ({
    network,
    sender,
    lamports,
    source,
    url,
    params,
}: StakeParams<Params<Blockhash>>): Promise<StakeResponse> => {
    try {
        const { connection, validator } = selectSolanaWalletSdkNetwork(network, url);

        // Get the minimum balance for rent exemption
        const minimumRent = await connection
            .getMinimumBalanceForRentExemption(BigInt(STAKE_ACCOUNT_V2_SIZE))
            .send();

        const [
            createStakeAccountInstruction,
            initializeStakeAccountInstruction,
            stakeAccountPublicKey,
        ] = await createAccountWithSeedTx(address(sender), BigInt(lamports) + minimumRent, source);
        const delegateInstruction = getDelegateStakeInstruction({
            stake: stakeAccountPublicKey,
            vote: validator,
            stakeHistory: STAKE_HISTORY_ACCOUNT,
            unused: STAKE_CONFIG_ACCOUNT,
            stakeAuthority: createNoopSigner(address(sender)),
        });

        let transactionMessage = await baseTx(connection, sender, params);
        transactionMessage = appendTransactionMessageInstruction(
            createStakeAccountInstruction,
            transactionMessage,
        );
        transactionMessage = appendTransactionMessageInstruction(
            initializeStakeAccountInstruction,
            transactionMessage,
        );
        transactionMessage = appendTransactionMessageInstruction(
            delegateInstruction,
            transactionMessage,
        );

        const signedTransactionMessage =
            source === null
                ? await partiallySignTransactionMessageWithSigners(transactionMessage)
                : transactionMessage;

        const feeSummary = getFeeSummary({ transactionMessage });
        const feeLamports = BigInt(feeSummary.feeLamports);
        const feeIncludingRentLamports = (feeLamports + minimumRent).toString();
        const deviceAmountLamports = (lamports + minimumRent).toString();
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports,
            feeLamports: feeSummary.feeLamports,
            rentLamports: minimumRent.toString(),
            feeIncludingRentLamports,
        };

        return {
            stakeTx: signedTransactionMessage,
            stakeAccount: stakeAccountPublicKey,
            txMeta,
        };
    } catch (error) {
        throw new Error(
            `Solana staking: staking failed - ${error instanceof Error ? error.message : serializeError(error)}`,
        );
    }
};

export const unstake = async ({
    network,
    sender,
    lamports,
    source,
    url,
    params,
}: StakeParams<Params<Blockhash>>): Promise<UnstakeResponse> => {
    try {
        const { connection } = selectSolanaWalletSdkNetwork(network, url);

        const stakeAccounts = await getDelegations(connection, sender);

        const epoch = params?.epoch || (await connection.getEpochInfo().send()).epoch;
        const tm = timestampInSec();

        let unstakeAmount = lamports;
        let totalActiveStake: bigint = 0n;
        const activeStakeAccounts = stakeAccounts.filter(acc => {
            if (acc.data.state.__kind !== 'Stake') {
                return false;
            }

            const isActive = !(
                isLockupInForce(acc.data, epoch, BigInt(tm)) ||
                stakeAccountState(acc.data, epoch) !== StakeState.Active
            );

            if (isActive) {
                totalActiveStake = totalActiveStake + acc.data.state.fields[1].delegation.stake;
            }

            return isActive;
        });

        if (totalActiveStake < lamports) throw new Error('Active stake less than requested');

        // ASC sort if num of accounts less than threshold otherwise DESC sorting
        activeStakeAccounts.sort((a, b): number => {
            const stakeA = isStake(a.data.state) ? a.data.state.fields[1].delegation.stake : 0n;
            const stakeB = isStake(b.data.state) ? b.data.state.fields[1].delegation.stake : 0n;

            if (activeStakeAccounts.length < MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT) {
                return Number(stakeA - stakeB);
            }

            return Number(stakeB - stakeA);
        });

        const accountsToDeactivate: Delegations = [];
        const accountsToSplit: [Account<StakeStateAccount, Address>, bigint][] = [];

        let i = 0;
        while (lamports > 0n && i < activeStakeAccounts.length) {
            const acc = activeStakeAccounts[i];
            if (acc === undefined || !isStake(acc.data.state)) {
                i++;
                continue;
            }

            const stakeAmount = acc.data.state.fields[1].delegation.stake;

            // If reminder amount less than min stake amount stake account automatically become disabled
            const isBelowThreshold = stakeAmount <= lamports || stakeAmount - lamports < MIN_AMOUNT;
            if (isBelowThreshold) {
                accountsToDeactivate.push(acc);
                lamports = lamports - stakeAmount;
                i++;

                // Max num of deactivate instructions reached
                if (accountsToDeactivate.length === MAX_DEACTIVATE_ACCOUNTS) {
                    unstakeAmount -= lamports;
                    break;
                }
                continue;
            }

            // Max num of deactivate instructions with split reached
            if (accountsToDeactivate.length > MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT) {
                unstakeAmount -= lamports;
                break;
            }

            accountsToSplit.push([acc, lamports]);
            break;
        }

        const senderPublicKey = address(sender);
        let transactionMessage = await baseTx(connection, sender, params);

        // Get the minimum balance for rent exemption. Send request only if split required
        const minimumRent =
            accountsToSplit.length > 0
                ? await connection
                      .getMinimumBalanceForRentExemption(BigInt(STAKE_ACCOUNT_V2_SIZE))
                      .send()
                : 0n;

        for (const acc of accountsToSplit) {
            const [splitInstructions, newStakeAccountPubkey] = await split(
                senderPublicKey,
                acc[1],
                acc[0].address,
                source,
                // Need additional value for rent
                minimumRent,
            );

            splitInstructions.forEach(
                splitInstruction =>
                    (transactionMessage = appendTransactionMessageInstruction(
                        splitInstruction,
                        transactionMessage,
                    )),
            );

            const deactivateInstruction = getDeactivateInstruction({
                stake: newStakeAccountPubkey,
                stakeAuthority: createNoopSigner(address(sender)),
            });

            transactionMessage = appendTransactionMessageInstruction(
                deactivateInstruction,
                transactionMessage,
            );
        }

        accountsToDeactivate.forEach(acc => {
            const deactivateInstruction = getDeactivateInstruction({
                stake: acc.address,
                stakeAuthority: createNoopSigner(address(sender)),
            });

            transactionMessage = appendTransactionMessageInstruction(
                deactivateInstruction,
                transactionMessage,
            );
        });

        if (transactionMessage.instructions.length === 0) {
            throw new Error('Zero instructions');
        }

        const feeSummary = getFeeSummary({ transactionMessage });
        const feeLamports = BigInt(feeSummary.feeLamports);
        const feeIncludingRentLamports = (feeLamports + minimumRent).toString();
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports: unstakeAmount.toString(),
            feeLamports: feeSummary.feeLamports,
            rentLamports: minimumRent.toString(),
            feeIncludingRentLamports,
        };

        return { unstakeTx: transactionMessage, unstakeAmount, txMeta };
    } catch (error) {
        throw new Error(
            `Solana staking: unstaking failed - ${error instanceof Error ? error.message : serializeError(error)}`,
        );
    }
};

export const claim = async ({
    network,
    sender,
    url,
    params,
}: ClaimParams<Params<Blockhash>>): Promise<ClaimResponse> => {
    try {
        const { connection } = selectSolanaWalletSdkNetwork(network, url);

        const delegations = await getDelegations(connection, sender);

        const epoch = params?.epoch || (await connection.getEpochInfo().send()).epoch;
        const tm = timestampInSec();

        const deactivatedStakeAccounts = delegations.filter(
            acc =>
                !isLockupInForce(acc.data, epoch, BigInt(tm)) &&
                stakeAccountState(acc.data, epoch) === StakeState.Deactivated,
        );

        if (deactivatedStakeAccounts.length === 0)
            throw new Error('Nothing to claim while claiming');

        let transactionMessage = await baseTx(connection, sender, params);

        let totalClaimableStake = 0n;
        let accountsForClaim = 0;
        for (const acc of deactivatedStakeAccounts) {
            // Create the withdraw instruction
            const withdrawInstruction = getWithdrawInstruction({
                stake: acc.address,
                recipient: address(sender),
                stakeHistory: STAKE_HISTORY_ACCOUNT,
                withdrawAuthority: createNoopSigner(address(sender)),
                args: acc.lamports,
            });

            transactionMessage = appendTransactionMessageInstruction(
                withdrawInstruction,
                transactionMessage,
            );

            totalClaimableStake += acc.lamports;
            accountsForClaim++;

            if (accountsForClaim === MAX_CLAIM_ACCOUNTS) {
                break;
            }
        }

        const feeSummary = getFeeSummary({ transactionMessage });
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports: totalClaimableStake.toString(),
            feeLamports: feeSummary.feeLamports,
            rentLamports: '0',
            feeIncludingRentLamports: feeSummary.feeLamports,
        };

        return {
            claimTx: transactionMessage,
            totalClaimAmount: totalClaimableStake,
            txMeta,
        };
    } catch (error) {
        throw new Error(
            `Solana staking: claiming failed - ${error instanceof Error ? error.message : serializeError(error)}`,
        );
    }
};

export const createTransactionShimCommon = (transaction: Transaction) => ({
    addSignature: (signerPubKey: string, signatureHex: string) => {
        if (signerPubKey in transaction.signatures) {
            const signatureBytes = getBase16Codec().encode(signatureHex) as SignatureBytes;
            transaction = Object.freeze({
                ...transaction,
                signatures: Object.freeze({
                    ...transaction.signatures,
                    [signerPubKey]: signatureBytes,
                }),
            });
        }
    },
    serializeMessage: () => getBase16Codec().decode(transaction.messageBytes),
    serialize: () => pipe(transaction, getTransactionEncoder().encode, getBase16Codec().decode),
});
