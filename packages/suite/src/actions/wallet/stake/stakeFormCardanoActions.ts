import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { type AdaPools } from '@suite-common/earn-staking-api';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import {
    calculate,
    composeStakingTransaction,
} from '@suite-common/staking/src/actions/stakeFormActions';
import { type EstimatedFee } from '@suite-common/staking-solana-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_DREP,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
} from '@suite-common/wallet-constants';
import { type VotingDelegationOption, selectCardanoPoolsInfo } from '@suite-common/wallet-core';
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
    getDelegationCertificates,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    getUnusedChangeAddress,
    getVotingCertificates,
    isTestnet,
    networkAmountToSmallestUnit,
    parseDrepBech32,
    selectBestCardanoPool,
    subunitsToUnits,
    validateCardanoDrep,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { type Dispatch, type GetState } from 'src/types/suite';

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

export const prepareTxPlan = async (
    account: Account,
    action: CardanoAction,
    cardanoPools: AdaPools['pools'],
    votingDelegation?: VotingDelegationOption,
) => {
    if (!account || account.networkType !== 'cardano') return;

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

    const selectedPool = selectBestCardanoPool(cardanoPools);

    const certificates = [];

    if (action === 'delegate') {
        if (!selectedPool) {
            return null;
        }

        certificates.push(
            ...getDelegationCertificates(stakingPath, selectedPool?.hex, !isStakingActive),
        );
    }

    if (action === 'delegate' || action === 'voteDelegate') {
        const isVotingToAnotherDrep =
            votingDelegation?.type === 'another_drep' &&
            validateCardanoDrep(votingDelegation.drepId);

        const drepBech32 = isVotingToAnotherDrep
            ? votingDelegation.drepId
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

    if (!response.success) throw new Error(response.error.message);

    return { txPlan: response.payload[0], certificates, withdrawals };
};

const getTransactionData = (
    formValues: StakeFormState,
    selectedAccount: SelectedAccountStatus,
    cardanoPools: AdaPools['pools'],
    votingDelegation?: VotingDelegationOption,
) => {
    const { stakeType } = formValues;

    if (selectedAccount.status !== 'loaded' || selectedAccount.account.networkType !== 'cardano') {
        return;
    }

    const { account } = selectedAccount;

    if (stakeType === 'stake') {
        return prepareTxPlan(account, 'delegate', cardanoPools, votingDelegation);
    }

    if (stakeType === 'unstake') {
        return prepareTxPlan(account, 'deregister', cardanoPools, votingDelegation);
    }

    if (stakeType === 'claim') {
        return prepareTxPlan(account, 'withdrawal', cardanoPools, votingDelegation);
    }

    if (stakeType === 'change-delegate') {
        return prepareTxPlan(account, 'voteDelegate', cardanoPools, votingDelegation);
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

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch, getState: GetState) => {
        const { selectedAccount, stake } = getState().wallet;
        const cardanoPools = selectCardanoPoolsInfo(getState());

        if (!selectedAccount.account) return;

        if (selectedAccount.status !== 'loaded') return;

        const txData = await getTransactionData(
            formValues,
            selectedAccount,
            cardanoPools,
            stake.votingDelegation,
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

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { selectedAccount, stake } = getState().wallet;
        const cardanoPools = selectCardanoPoolsInfo(getState());
        if (!selectedAccount || !selectedAccount.account) return;

        const device = selectSelectedDevice(getState());
        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        ) {
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
            stake.votingDelegation,
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

        const { txPlan, certificates, withdrawals } = txData;

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
            asTypedDesktopAnalytics(extra.services.analytics).report({
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

        return signedTx.payload.serializedTx;
    };
