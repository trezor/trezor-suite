import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type SelectedAccountRootState, selectFullSelectedAccount } from '@suite/account';
import {
    type DesktopAnalyticsDep,
    type StakingCardanoPoolDelegationPayload,
    events,
} from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type AdaPools } from '@suite-common/earn-staking-api';
import { type WithServices } from '@suite-common/redux-utils';
import {
    calculate,
    composeStakingTransaction,
} from '@suite-common/staking/src/actions/stakeFormActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_DREP,
    EVERSTAKE_POOL_NAMES,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
} from '@suite-common/wallet-constants';
import {
    type AccountVotingDelegation,
    type StakeRootState,
    selectCardanoPoolsInfo,
    selectStakeVotingDelegation,
} from '@suite-common/wallet-core';
import {
    type Account,
    type CardanoAction,
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
    type SelectedAccountStatus,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getAddressParameters,
    getCardanoAccountPoolId,
    getDelegationCertificates,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    getUnusedChangeAddress,
    getVotingCertificates,
    hasCardanoLiveVoteDelegation,
    isCardanoStakedWithEverstake,
    isTestnet,
    networkAmountToSmallestUnit,
    parseDrepBech32,
    selectBestCardanoPool,
    subunitsToUnits,
    validateCardanoDrep,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, PROTO } from '@trezor/connect';
import { type ErrorCode } from '@trezor/connect-common/src/constants/errors';
import type { EstimatedFee } from '@trezor/network-solana/types'; // TODO should be Cardano instead?
import { BigNumber } from '@trezor/utils';

/**
 * TrezorConnect error messages may embed the rejected payload verbatim — `@trezor/schema-utils`
 * builds `Invalid parameter "account.utxo" (= [{"txid":…,"address":…}])` out of the params it
 * validates. Such a message must never travel any further, because an uncaught rejection ends up
 * in Sentry through its global unhandled-rejection handler. Only the error code, a fixed enum,
 * is safe to carry.
 */
export class CardanoComposeError extends Error {
    readonly code: ErrorCode;

    constructor(code: ErrorCode) {
        super(`cardanoComposeTransaction failed (${code})`);
        this.name = 'CardanoComposeError';
        this.code = code;
    }
}

const calculateTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
    estimatedFee?: EstimatedFee,
): PrecomposedTransaction => {
    const feeInBaseUnits = estimatedFee?.payload?.feePerTx ?? '0';

    const stakingParams = {
        feeInBaseUnits,
        minBalanceForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_CARDANO_BALANCE_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_CARDANO_AMOUNT_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForWithdrawalInBaseUnits: networkAmountToSmallestUnit(
            MIN_CARDANO_FOR_WITHDRAWALS.toString(),
            symbol,
        ),
    };

    const estimatedFeeLevel = { ...feeLevel, ...estimatedFee?.payload };

    return calculate(
        availableBalance,
        output,
        estimatedFeeLevel,
        compareWithAmount,
        symbol,
        stakingParams,
        estimatedFee,
    );
};

type PrepareTxPlanParams = {
    account: Account;
    action: CardanoAction;
    cardanoPools: AdaPools['pools'];
    votingDelegation?: AccountVotingDelegation;
};

export const prepareTxPlan = async ({
    account,
    action,
    cardanoPools,
    votingDelegation,
}: PrepareTxPlanParams) => {
    if (account?.networkType !== 'cardano') return;

    const changeAddress = getUnusedChangeAddress(account);
    const stakingPath = getStakingPath(account);

    const {
        rewards: rewardsAmount,
        address: stakeAddress,
        isActive: isStakingActive,
    } = account?.misc?.staking ?? {};

    if (!changeAddress || !account.utxo || !account.addresses) {
        return null;
    }

    if (action === 'withdrawal' && (!rewardsAmount || !stakeAddress)) {
        return null;
    }

    const addressParameters = getAddressParameters(account, changeAddress.path);

    const selectedPool = selectBestCardanoPool(cardanoPools, getCardanoAccountPoolId(account));

    const certificates = [];

    if (action === 'delegate') {
        if (!selectedPool) {
            return null;
        }

        certificates.push(
            ...getDelegationCertificates(stakingPath, selectedPool?.hex, !isStakingActive),
        );
    }

    // The signing path reads the selection straight from the store, so a selection left over from
    // another account must never reach the certificates. Everything below derives from the option
    // confirmed for this very account, falling back to Everstake.
    const confirmedOption =
        votingDelegation?.accountKey === account.key ? votingDelegation.option : undefined;

    const isKeepingCurrentVote =
        confirmedOption?.type === 'current' && hasCardanoLiveVoteDelegation(account);

    if ((action === 'delegate' || action === 'voteDelegate') && !isKeepingCurrentVote) {
        const isVotingToAnotherDrep = confirmedOption?.type === 'another_drep';

        if (isVotingToAnotherDrep && !validateCardanoDrep(confirmedOption.drepId)) {
            return null;
        }

        const drepBech32 = isVotingToAnotherDrep
            ? confirmedOption.drepId
            : CARDANO_EVERSTAKE_DREP.bech32;

        const dRep = parseDrepBech32(drepBech32);
        certificates.push(...getVotingCertificates(stakingPath, dRep));
    }

    if (action === 'deregister') {
        certificates.push({
            type: PROTO.CardanoCertificateType.STAKE_DEREGISTRATION,
            path: stakingPath,
        });
    }

    const isDeregisterWithRewards = action === 'deregister' && new BigNumber(rewardsAmount).gt(0);

    const withdrawals =
        action === 'withdrawal' || isDeregisterWithRewards
            ? [
                  {
                      amount: rewardsAmount,
                      path: stakingPath,
                      stakeAddress,
                  },
              ]
            : [];

    if (certificates.length === 0 && withdrawals.length === 0) {
        return null;
    }

    const response = await TrezorConnect.cardanoComposeTransaction({
        account: {
            descriptor: account.descriptor,
            utxo: account.utxo,
        },
        certificates,
        withdrawals,
        changeAddress,
        addressParameters,
        testnet: isTestnet(account.symbol),
    });

    if (!response.success) throw new CardanoComposeError(response.error.code);

    return { txPlan: response.payload[0], certificates, withdrawals, selectedPool };
};

const getTransactionData = (
    formValues: StakeFormState,
    selectedAccount: SelectedAccountStatus,
    cardanoPools: AdaPools['pools'],
    votingDelegation?: AccountVotingDelegation,
) => {
    const { stakeType } = formValues;

    if (selectedAccount.status !== 'loaded' || selectedAccount.account.networkType !== 'cardano') {
        return;
    }

    const { account } = selectedAccount;

    if (stakeType === 'stake') {
        return prepareTxPlan({ account, action: 'delegate', cardanoPools, votingDelegation });
    }

    if (stakeType === 'unstake') {
        return prepareTxPlan({ account, action: 'deregister', cardanoPools, votingDelegation });
    }

    if (stakeType === 'claim') {
        return prepareTxPlan({ account, action: 'withdrawal', cardanoPools, votingDelegation });
    }

    if (stakeType === 'change-delegate') {
        return prepareTxPlan({ account, action: 'voteDelegate', cardanoPools, votingDelegation });
    }
};

export const calculateOutputAmount = (
    account: Account,
    stakeType: StakeType,
    totalSpent?: string,
) => {
    let amount;

    switch (stakeType) {
        case 'stake':
        case 'unstake':
            amount = new BigNumber(account.availableBalance ?? '0').minus(totalSpent ?? '0');
            break;
        case 'claim':
            amount = new BigNumber(account.balance ?? '0').minus(account.availableBalance ?? '0');
            break;
        default:
            return '0';
    }

    return subunitsToUnits({
        value: asAmountSubunit(amount),
        symbol: account.symbol,
    }).toString();
};

type ComposeTransactionThunkState = SelectedAccountRootState & StakeRootState;

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch<UnknownAction>, getState: () => ComposeTransactionThunkState) => {
        const selectedAccount = selectFullSelectedAccount(getState());
        const cardanoPools = selectCardanoPoolsInfo(getState());
        const votingDelegation = selectStakeVotingDelegation(getState());

        if (!selectedAccount.account) return;

        if (selectedAccount.status !== 'loaded') return;

        const txData = await getTransactionData(
            formValues,
            selectedAccount,
            cardanoPools,
            votingDelegation,
        );
        const { txPlan } = txData || {};
        if (txPlan?.type !== 'final') return;

        const amountAda = calculateOutputAmount(
            selectedAccount.account,
            formValues.stakeType,
            txPlan?.totalSpent,
        );

        const firstOutput = formValues.outputs[0];
        if (!firstOutput) return;

        const outputExtended = {
            ...firstOutput,
            amount: amountAda,
        };

        const formValuesExtended: StakeFormState = {
            ...formValues,
            cryptoInput: amountAda,
            outputs: [outputExtended],
        };

        const estimatedFee =
            txData?.txPlan?.type === 'final'
                ? {
                      success: true,
                      payload: {
                          feePerTx: txData.txPlan.fee,
                          feePerUnit: '',
                          feeLimit: '',
                      },
                  }
                : undefined;

        const { feeInfo } = formState;
        if (!feeInfo) return;

        const { levels } = feeInfo;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        return composeStakingTransaction(
            formValuesExtended,
            formState,
            predefinedLevels,
            calculateTransaction,
            estimatedFee,
            undefined,
        );
    };

// Report the pool from the certificate that was actually signed, not a later
// recomputation — a divergence from the account pool must stay observable.
const getPoolDelegation = (
    stakeType: StakeType,
    account: Account,
    selectedPool: ReturnType<typeof selectBestCardanoPool>,
    cardanoPools: AdaPools['pools'],
): StakingCardanoPoolDelegationPayload | undefined => {
    if (stakeType !== 'stake') return undefined;

    const fromPool = getCardanoAccountPoolId(account);

    return {
        fromPool: fromPool ? (EVERSTAKE_POOL_NAMES[fromPool] ?? fromPool) : undefined,
        toPool: EVERSTAKE_POOL_NAMES[selectedPool.bech32] ?? selectedPool.bech32,
        toPoolSaturation: cardanoPools.find(pool => pool.id === selectedPool.bech32)?.saturation,
        poolsDataAvailable: cardanoPools.length > 0,
        isEverstakeToEverstake:
            fromPool !== null &&
            fromPool !== selectedPool.bech32 &&
            isCardanoStakedWithEverstake(account, cardanoPools),
    };
};

type SignTransactionThunkState = DeviceRootState & SelectedAccountRootState & StakeRootState;

type SignTransactionThunkDeps = WithServices<DesktopAnalyticsDep>;

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (
        dispatch: Dispatch<UnknownAction>,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ) => {
        const selectedAccount = selectFullSelectedAccount(getState());
        const cardanoPools = selectCardanoPoolsInfo(getState());
        const votingDelegation = selectStakeVotingDelegation(getState());
        if (!selectedAccount?.account) return;

        const device = selectSelectedDevice(getState());
        if (selectedAccount.status !== 'loaded' || !device || transactionInfo?.type !== 'final') {
            return;
        }

        const { account } = selectedAccount;
        if (account.networkType !== 'cardano') {
            return;
        }

        const txData = await getTransactionData(
            formValues,
            selectedAccount,
            cardanoPools,
            votingDelegation,
        );

        if (!txData) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Unknown stake action',
                }),
            );

            return;
        }

        const { txPlan, certificates, withdrawals, selectedPool } = txData;

        if (!txPlan || txPlan.type === 'nonfinal') return;

        if (txPlan.type === 'error') {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: txPlan.error,
                }),
            );

            return;
        }

        const signedTx = await TrezorConnect.cardanoSignTransaction({
            signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
            device,
            inputs: txPlan.inputs,
            outputs: txPlan.outputs,
            unsignedTx: txPlan.unsignedTx,
            testnet: isTestnet(account.symbol),
            fee: txPlan.fee,
            protocolMagic: getProtocolMagic(account.symbol),
            networkId: getNetworkId(),
            derivationType: getDerivationType(account.accountType),
            tagCborSets: true,
            ttl: txPlan.ttl?.toString(),
            ...(certificates.length > 0 ? { certificates } : {}),
            ...(withdrawals.length > 0 ? { withdrawals } : {}),
        });

        if (!signedTx.success) {
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

            // catch manual error from TransactionReviewModal
            if (signedTx.error.message === 'tx-cancelled') {
                return;
            }

            if (signedTx.error.message !== 'tx-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: signedTx.error.message,
                    }),
                );
            }

            return signedTx;
        }

        return {
            serializedTx: signedTx.payload.serializedTx,
            poolDelegation: getPoolDelegation(
                formValues.stakeType,
                account,
                selectedPool,
                cardanoPools,
            ),
        };
    };
