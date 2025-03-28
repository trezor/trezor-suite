import {
    Account,
    Address,
    Blockhash,
    CompilableTransactionMessage,
    IInstruction,
    SignatureBytes,
    Transaction,
    TransactionMessageWithBlockhashLifetime,
    address,
    appendTransactionMessageInstruction,
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
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
    STAKE_PROGRAM_ADDRESS,
    StakeStateAccount,
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

import {
    STAKE_ACCOUNT_V2_SIZE,
    getDelegations,
    isStake,
    stakeAccountState,
} from '@trezor/blockchain-link/src/workers/solana/stakingAccounts';
import { StakeState } from '@trezor/blockchain-link-types/src/solana';

import { selectSolanaWalletSdkNetwork } from './connection';
import {
    ADDRESS_DEFAULT,
    MAX_CLAIM_ACCOUNTS,
    MAX_DEACTIVATE_ACCOUNTS,
    MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
    MIN_AMOUNT,
    STAKE_CONFIG_ACCOUNT,
    STAKE_HISTORY_ACCOUNT,
} from './constants';
import {
    ClaimParams,
    ClaimResponse,
    Connection,
    Delegations,
    Params,
    StakeParams,
    StakeResponse,
    UnstakeResponse,
} from './types';

const formatEverstakeSource = (source: string): string => {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
};

const createAccountWithSeedTx = async (
    authorityPublicKey: Address,
    lamports: bigint,
    source: string,
): Promise<[IInstruction, IInstruction, Address]> => {
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

    let transactionMessage = pipe(
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
): Promise<[Array<IInstruction>, Address]> => {
    // Format source to
    const seed = formatEverstakeSource(source);

    const newStakeAccountPubkey = await createAddressWithSeed({
        baseAddress: authorityPublicKey,
        programAddress: STAKE_PROGRAM_ADDRESS,
        seed,
    });

    const instructions: Array<IInstruction> = [];

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

        return {
            stakeTx: signedTransactionMessage,
            stakeAccount: stakeAccountPublicKey,
        };
    } catch {
        throw new Error('An error occurred while staking');
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

        return { unstakeTx: transactionMessage, unstakeAmount };
    } catch {
        throw new Error('An error occurred while unstaking the stake');
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

        return {
            claimTx: transactionMessage,
            totalClaimAmount: totalClaimableStake,
        };
    } catch {
        throw new Error('An error occurred while claim SOL');
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
