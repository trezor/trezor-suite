import {
    calculate,
    composeStakingTransaction,
} from '@suite-common/staking/src/actions/stakeFormActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_STAKING_POOL,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
} from '@suite-common/wallet-constants';
import { ComposeActionContext, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Account,
    CardanoAction,
    DRepResponse,
    EstimatedFee,
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    SelectedAccountStatus,
    StakeFormState,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getAddressParameters,
    getDelegationCertificates,
    getDerivationType,
    getNetworkId,
    getNetworkName,
    getProtocolMagic,
    getStakingPath,
    getUnusedChangeAddress,
    getVotingCertificates,
    isTestnet,
    networkAmountToSmallestUnit,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import TrezorConnect, { FeeLevel, PROTO } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Dispatch, GetState } from 'src/types/suite';

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

    const estimatedFeeLevel = { ...feeLevel, ...estimatedFee };

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
    trezorDRep?: DRepResponse,
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

    const pool = CARDANO_EVERSTAKE_STAKING_POOL.hex;

    let certificates =
        action === 'delegate' ? getDelegationCertificates(stakingPath, pool, !isStakingActive) : [];

    if (action === 'voteAbstain') {
        const dRep = { type: PROTO.CardanoDRepType.ABSTAIN };
        certificates = getVotingCertificates(stakingPath, dRep);
    }

    if (action === 'voteDelegate') {
        const dRep = {
            type: PROTO.CardanoDRepType.KEY_HASH,
            hex: trezorDRep?.drep?.hex,
        };
        certificates = getVotingCertificates(stakingPath, dRep);
    }

    if (action === 'deregister') {
        certificates = [
            {
                type: PROTO.CardanoCertificateType.STAKE_DEREGISTRATION,
                path: stakingPath,
            },
        ];
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

    if (!response.success) throw new Error(response.payload.error);

    return { txPlan: response.payload[0], certificates, withdrawals };
};

const getTransactionData = (
    formValues: StakeFormState,
    selectedAccount: SelectedAccountStatus,
    trezorDRep?: DRepResponse,
) => {
    const { stakeType } = formValues;

    if (selectedAccount.status !== 'loaded' || selectedAccount.account.networkType !== 'cardano') {
        return;
    }

    const { account } = selectedAccount;

    if (stakeType === 'stake') {
        return prepareTxPlan(account, 'delegate', trezorDRep);
    }

    if (stakeType === 'unstake') {
        return prepareTxPlan(account, 'deregister', trezorDRep);
    }
};

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch, getState: GetState) => {
        const { selectedAccount, cardanoStaking } = getState().wallet;
        if (!selectedAccount || !selectedAccount.account) return;

        const cardanoNetwork = getNetworkName(selectedAccount?.account?.symbol);
        const { trezorDRep } = cardanoStaking[cardanoNetwork] || {};

        if (selectedAccount.status !== 'loaded') return;

        const txData = await getTransactionData(formValues, selectedAccount, trezorDRep);
        const { txPlan } = txData || {};
        if (!txPlan || txPlan.type !== 'final') return;

        const stakedBalance = new BigNumber(selectedAccount?.account.balance ?? '0').minus(
            txPlan?.totalSpent ?? '0',
        );
        const stakedBalanceAda = subunitsToUnits({
            value: asAmountSubunit(stakedBalance),
            symbol: selectedAccount.account.symbol,
        }).toString();

        const outputExtended = {
            ...formValues.outputs[0],
            amount: stakedBalanceAda,
        };

        const formValuesExtended = {
            ...formValues,
            cryptoInput: stakedBalanceAda,
            outputs: [outputExtended],
        };

        const estimatedFee =
            txData?.txPlan.type === 'final'
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
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount, cardanoStaking } = getState().wallet;
        if (!selectedAccount || !selectedAccount.account) return;

        const cardanoNetwork = getNetworkName(selectedAccount?.account?.symbol);
        const { trezorDRep } = cardanoStaking[cardanoNetwork] || {};

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

        const txData = await getTransactionData(formValues, selectedAccount, trezorDRep);

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
            useEmptyPassphrase: device?.useEmptyPassphrase,
            inputs: txPlan.inputs,
            outputs: txPlan.outputs,
            unsignedTx: txPlan.unsignedTx,
            testnet: isTestnet(account.symbol),
            fee: txPlan.fee,
            protocolMagic: getProtocolMagic(account.symbol),
            networkId: getNetworkId(account.symbol),
            derivationType: getDerivationType(account.accountType),
            tagCborSets: true,
            ttl: txPlan.ttl?.toString(),
            ...(certificates.length > 0 ? { certificates } : {}),
            ...(withdrawals.length > 0 ? { withdrawals } : {}),
        });

        if (!signedTx.success) {
            analytics.report({
                type: EventType.TransactionCancel,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

            // catch manual error from TransactionReviewModal
            if (signedTx.payload.error === 'tx-cancelled') {
                return;
            }

            if (signedTx.payload.error !== 'tx-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: signedTx.payload.error,
                    }),
                );
            }

            return signedTx;
        }

        return signedTx.payload.serializedTx;
    };
