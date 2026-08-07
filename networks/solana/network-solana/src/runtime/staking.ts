import {
    address,
    appendTransactionMessageInstruction,
    createNoopSigner,
    partiallySignTransactionMessageWithSigners,
} from '@solana/kit';
import {
    getDeactivateInstruction,
    getDelegateStakeInstruction,
    getWithdrawInstruction,
} from '@solana-program/stake';

import { serializeError } from '@trezor/utils';

import {
    EVERSTAKE_SOLANA_DEVNET_VALIDATOR,
    EVERSTAKE_SOLANA_MAINNET_VALIDATOR,
    EVERSTAKE_VOTER_PUBKEYS,
    MAX_CLAIM_ACCOUNTS,
    MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
    MIN_STAKE_DELEGATION,
    STAKE_ACCOUNT_V2_SIZE,
    type SolanaNetworkSymbol,
    StakeState,
} from '../constants';
import type {
    Account,
    Address,
    Blockhash,
    ClaimParams,
    ClaimResponse,
    Delegations,
    Params,
    PrepareClaimSolTxParams,
    PrepareStakeSolTxParams,
    PrepareStakeSolTxResponse,
    Rpc,
    RpcMainnet,
    SolanaRpcApiMainnet,
    SolanaStakingAccount,
    SolanaTxMeta,
    StakeParams,
    StakeResponse,
    StakeStateAccount,
    UnstakeParams,
    UnstakeResponse,
} from '../types';
import { createTransactionShim } from './shim';
import {
    baseTx,
    createAccountWithSeedTx,
    getDelegations,
    getFeeSummary,
    getStakingParams,
    isCompilableTransactionMessage,
    isLockupInForce,
    isStake,
    split,
    stakeAccountState,
    timestampInSec,
    toLamports,
} from './stakingUtils';

const STAKE_HISTORY_ACCOUNT = address('SysvarStakeHistory1111111111111111111111111');
const STAKE_CONFIG_ACCOUNT = address('StakeConfig11111111111111111111111111111111');

/** @see {@link file://./../../../../suite-common/wallet-constants/src/stakingConstants.ts}  */
const WALLET_SDK_SOURCE = '1';

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

export const stake = async ({
    connection,
    validator,
    sender,
    lamports,
    source,
    params,
}: StakeParams<Params<Blockhash>>): Promise<StakeResponse> => {
    try {
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

        const feeSummary = getFeeSummary(transactionMessage);
        const feeLamports = BigInt(feeSummary.feeLamports);
        const feeIncludingRentLamports = (feeLamports + minimumRent).toString();
        const deviceAmountLamports = (lamports + minimumRent).toString();
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports,
            feeLamports: feeSummary.feeLamports,
            rentLamports: minimumRent.toString(),
            feeIncludingRentLamports,
            hasSplitInstruction: false,
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
    connection,
    sender,
    lamports,
    source,
    params,
}: UnstakeParams<Params<Blockhash>>): Promise<UnstakeResponse> => {
    try {
        const stakeAccounts = await getDelegations(connection, sender);

        const epoch = params?.epoch || (await connection.getEpochInfo().send()).epoch;
        const tm = timestampInSec();

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

        let remaining = lamports;
        let unstakeAmount = 0n;
        let i = 0;
        while (remaining > 0n && i < activeStakeAccounts.length) {
            const acc = activeStakeAccounts[i];
            if (acc === undefined || !isStake(acc.data.state)) {
                i++;
                continue;
            }

            const stakeAmount = acc.data.state.fields[1].delegation.stake;

            // The whole account is needed to reach the requested amount: deactivate it entirely.
            if (stakeAmount <= remaining) {
                accountsToDeactivate.push(acc);
                unstakeAmount += stakeAmount;
                remaining -= stakeAmount;
                i++;

                // Same cap as the split path, so a full unstake hits the same per-tx account limit.
                if (accountsToDeactivate.length === MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT) {
                    break;
                }
                continue;
            }

            // Max num of deactivate instructions with split reached
            if (accountsToDeactivate.length > MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT) {
                break;
            }

            // Split `remaining` off only if both legs stay above the minimum; otherwise deactivate the whole account.
            const splitProducesValidAccount = remaining >= MIN_STAKE_DELEGATION;
            const splitLeavesValidRemainder = stakeAmount - remaining >= MIN_STAKE_DELEGATION;
            if (splitProducesValidAccount && splitLeavesValidRemainder) {
                accountsToSplit.push([acc, remaining]);
                unstakeAmount += remaining;
            } else {
                accountsToDeactivate.push(acc);
                unstakeAmount += stakeAmount;
            }
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

        const feeSummary = getFeeSummary(transactionMessage);
        const feeLamports = BigInt(feeSummary.feeLamports);
        const feeIncludingRentLamports = (feeLamports + minimumRent).toString();
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports: unstakeAmount.toString(),
            feeLamports: feeSummary.feeLamports,
            rentLamports: minimumRent.toString(),
            feeIncludingRentLamports,
            hasSplitInstruction: accountsToSplit.length > 0,
        };

        return { unstakeTx: transactionMessage, unstakeAmount, txMeta };
    } catch (error) {
        throw new Error(
            `Solana staking: unstaking failed - ${error instanceof Error ? error.message : serializeError(error)}`,
        );
    }
};

export const claim = async ({
    connection,
    sender,
    params,
}: ClaimParams<Params<Blockhash>>): Promise<ClaimResponse> => {
    try {
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

        const feeSummary = getFeeSummary(transactionMessage);
        const txMeta: SolanaTxMeta = {
            deviceAmountLamports: totalClaimableStake.toString(),
            feeLamports: feeSummary.feeLamports,
            rentLamports: '0',
            feeIncludingRentLamports: feeSummary.feeLamports,
            hasSplitInstruction: false,
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

export const prepareStakeSolTx = async ({
    from,
    amount,
    connection,
    validator,
    estimatedFee,
    source = WALLET_SDK_SOURCE,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = toLamports(amount);
        const params = getStakingParams(estimatedFee);
        const tx = await stake({
            connection,
            validator,
            sender: from,
            lamports: BigInt(lamports),
            source,
            params,
        });

        const { stakeTx } = tx;

        if (!isCompilableTransactionMessage(stakeTx)) {
            throw new Error('Transaction is not compilable');
        }

        const txShim = createTransactionShim(stakeTx);

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
    source = WALLET_SDK_SOURCE,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = toLamports(amount);
        const params = getStakingParams(estimatedFee);
        const tx = await unstake({
            connection,
            sender: from,
            lamports: BigInt(lamports),
            source,
            params,
        });
        const txShim = createTransactionShim(tx.unstakeTx);

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
        const txShim = createTransactionShim(tx.claimTx);

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

export const selectSolanaValidator = (symbol: SolanaNetworkSymbol): Address => {
    switch (symbol) {
        case 'dsol':
            return address(EVERSTAKE_SOLANA_DEVNET_VALIDATOR);
        case 'sol':
            return address(EVERSTAKE_SOLANA_MAINNET_VALIDATOR);
    }
};
