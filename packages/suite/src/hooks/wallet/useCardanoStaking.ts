import { useState, useCallback, useMemo } from 'react';

import { ActionAvailability, CardanoStaking } from 'src/types/wallet/cardanoStaking';
import { SUITE } from 'src/actions/suite/constants';
import { useActions, useSelector } from 'src/hooks/suite';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import {
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getChangeAddressParameters,
    getDelegationCertificates,
    composeTxPlan,
    isPoolOverSaturated,
    getStakePoolForDelegation,
    getTtl,
    loadCardanoLib,
} from 'src/utils/wallet/cardanoUtils';
import { AppState } from 'src/types/suite';

import { isTestnet, getDerivationType } from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import trezorConnect, { PROTO } from '@trezor/connect';
import { addFakePendingCardanoTxThunk } from '@suite-common/wallet-core';

const getDeviceAvailability = (
    device: AppState['suite']['device'],
    locks: AppState['suite']['locks'],
) => {
    // Handle all external cases where it is not possible to make delegate or withdrawal action
    if (!device?.connected) {
        return {
            status: false,
            reason: 'DEVICE_DISCONNECTED',
        } as const;
    }
    if (locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
        return {
            status: false,
            reason: 'DEVICE_LOCK',
        } as const;
    }

    return {
        status: true,
    };
};

export const getReasonForDisabledAction = (reason: ActionAvailability['reason']) => {
    switch (reason) {
        case 'POOL_ID_FETCH_FAIL':
            return 'TR_STAKING_TREZOR_POOL_FAIL';
        case 'UTXO_BALANCE_INSUFFICIENT':
            return 'TR_STAKING_NOT_ENOUGH_FUNDS';
        default:
            return null;
    }
};

export const useCardanoStaking = (): CardanoStaking => {
    const account = useSelector(state => state.wallet.selectedAccount.account);
    if (!account || account.networkType !== 'cardano') {
        throw Error('useCardanoStaking used for other network');
    }

    const { device, locks, pendingStakeTxs, cardanoStaking } = useSelector(state => ({
        device: state.suite.device,
        locks: state.suite.locks,
        pendingStakeTxs: state.wallet.cardanoStaking.pendingTx,
        cardanoStaking: state.wallet.cardanoStaking,
    }));
    const { addToast, setPendingStakeTx, addFakePendingCardanoTx } = useActions({
        addToast: notificationsActions.addToast,
        setPendingStakeTx: cardanoStakingActions.setPendingStakeTx,
        addFakePendingCardanoTx: addFakePendingCardanoTxThunk,
    });
    const [deposit, setDeposit] = useState<undefined | string>(undefined);
    const [fee, setFee] = useState<undefined | string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [delegatingAvailable, setDelegatingAvailable] = useState<
        CardanoStaking['delegatingAvailable']
    >({
        status: false,
    });
    const [withdrawingAvailable, seWithdrawingAvailable] = useState<
        CardanoStaking['withdrawingAvailable']
    >({
        status: false,
    });
    const [error, setError] = useState<string | undefined>(undefined);
    const stakingPath = getStakingPath(account);
    const pendingStakeTx = pendingStakeTxs.find(tx => tx.accountKey === account.key);

    const {
        rewards: rewardsAmount,
        address: stakeAddress,
        poolId: registeredPoolId,
        isActive: isStakingActive,
    } = account.misc.staking;

    const cardanoNetwork = account.symbol === 'ada' ? 'mainnet' : 'preview';
    const { trezorPools, isFetchLoading, isFetchError } = cardanoStaking[cardanoNetwork];
    const currentPool =
        registeredPoolId && trezorPools
            ? trezorPools?.pools.find(p => p.bech32 === registeredPoolId)
            : null;
    const isStakingOnTrezorPool = !isFetchLoading && !isFetchError ? !!currentPool : true; // fallback to true to prevent flickering in UI while we fetch the data
    const isCurrentPoolOversaturated = currentPool ? isPoolOverSaturated(currentPool) : false;
    const changeAddress = useMemo(() => getChangeAddressParameters(account), [account]);
    const prepareTxPlan = useCallback(
        (action: 'delegate' | 'withdrawal') => {
            if (!changeAddress) return null;

            const pool = trezorPools
                ? getStakePoolForDelegation(trezorPools, account.balance).hex
                : '';

            const certificates =
                action === 'delegate'
                    ? getDelegationCertificates(stakingPath, pool, !isStakingActive)
                    : [];
            const withdrawals =
                action === 'withdrawal'
                    ? [
                          {
                              amount: rewardsAmount,
                              path: stakingPath,
                              stakeAddress,
                          },
                      ]
                    : [];

            return composeTxPlan(
                account.descriptor,
                account.utxo,
                certificates,
                withdrawals,
                changeAddress,
                getTtl(isTestnet(account.symbol)),
            );
        },
        [
            changeAddress,
            account.balance,
            account.descriptor,
            account.utxo,
            account.symbol,
            stakingPath,
            isStakingActive,
            rewardsAmount,
            stakeAddress,
            trezorPools,
        ],
    );

    const calculateFeeAndDeposit = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            setLoading(true);
            const { CoinSelectionError } = await loadCardanoLib();
            try {
                const composeRes = await prepareTxPlan(action);
                if (composeRes) {
                    setFee(composeRes.txPlan.fee);
                    setDeposit(composeRes.txPlan.deposit);
                    const actionAvailability: ActionAvailability =
                        composeRes.txPlan.type === 'final'
                            ? {
                                  status: true,
                              }
                            : {
                                  status: false,
                                  reason: 'TX_NOT_FINAL',
                              };
                    setDelegatingAvailable(actionAvailability);
                    seWithdrawingAvailable(actionAvailability);
                }
            } catch (err) {
                // todo:  noted that this err appears regularly. error becomes undefined
                // which effectively removes any previously set errors
                // Deserialization failed in Ed25519KeyHash because: Invalid cbor: expected tuple 'hash length' of length 28 but got length Len(0).
                const actionAvailability: ActionAvailability = {
                    status: false,
                    reason: err instanceof CoinSelectionError ? err.code : err.message,
                };
                setDelegatingAvailable(actionAvailability);
                seWithdrawingAvailable(actionAvailability);
            }

            setLoading(false);
        },
        [prepareTxPlan],
    );

    const signAndPushTransaction = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            const composeRes = await prepareTxPlan(action);
            if (!composeRes) return;

            const { trezorUtils } = await loadCardanoLib();
            const { txPlan, certificates, withdrawals, changeAddress } = composeRes;

            if (!txPlan || txPlan.type !== 'final') return;

            const res = await trezorConnect.cardanoSignTransaction({
                signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
                device,
                useEmptyPassphrase: device?.useEmptyPassphrase,
                inputs: trezorUtils.transformToTrezorInputs(txPlan.inputs, account.utxo ?? []),
                outputs: trezorUtils.transformToTrezorOutputs(
                    txPlan.outputs,
                    changeAddress.addressParameters,
                ),
                fee: txPlan.fee,
                protocolMagic: getProtocolMagic(account.symbol),
                networkId: getNetworkId(account.symbol),
                derivationType: getDerivationType(account.accountType),
                ttl: txPlan.ttl?.toString(),
                ...(certificates.length > 0 ? { certificates } : {}),
                ...(withdrawals.length > 0 ? { withdrawals } : {}),
            });

            if (!res.success) {
                if (res.payload.error === 'tx-cancelled') return;
                addToast({
                    type: 'sign-tx-error',
                    error: res.payload.error,
                });
            } else {
                const signedTx = trezorUtils.signTransaction(
                    txPlan.tx.body,
                    res.payload.witnesses,
                    {
                        testnet: isTestnet(account.symbol),
                    },
                );
                const sentTx = await trezorConnect.pushTransaction({
                    tx: signedTx,
                    coin: account.symbol,
                });

                if (sentTx.success) {
                    const { txid } = sentTx.payload;
                    addToast({
                        type: 'raw-tx-sent',
                        txid,
                    });
                    addFakePendingCardanoTx({ precomposedTx: txPlan, txid, account });
                    setPendingStakeTx(account, txid);
                } else {
                    addToast({
                        type: 'sign-tx-error',
                        error: sentTx.payload.error,
                    });
                }
            }
        },
        [account, addFakePendingCardanoTx, addToast, device, prepareTxPlan, setPendingStakeTx],
    );

    const action = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            setError(undefined);
            setLoading(true);
            const { CoinSelectionError } = await loadCardanoLib();

            try {
                await signAndPushTransaction(action);
            } catch (error) {
                if (
                    error instanceof CoinSelectionError &&
                    error.code === 'UTXO_BALANCE_INSUFFICIENT'
                ) {
                    setError('AMOUNT_IS_NOT_ENOUGH');
                    addToast({
                        type:
                            action === 'delegate'
                                ? 'cardano-delegate-error'
                                : 'cardano-withdrawal-error',
                        error: error.code,
                    });
                } else {
                    addToast({
                        type: 'sign-tx-error',
                        error: error.message,
                    });
                }
            }
            setLoading(false);
        },
        [addToast, signAndPushTransaction],
    );

    const delegate = useCallback(() => action('delegate'), [action]);
    const withdraw = useCallback(() => action('withdrawal'), [action]);

    return {
        deposit,
        fee,
        loading,
        pendingStakeTx,
        deviceAvailable: getDeviceAvailability(device, locks),
        delegatingAvailable,
        withdrawingAvailable,
        registeredPoolId,
        isActive: isStakingActive,
        isFetchError,
        rewards: rewardsAmount,
        address: stakeAddress,
        isStakingOnTrezorPool,
        isCurrentPoolOversaturated,
        delegate,
        withdraw,
        calculateFeeAndDeposit,
        trezorPools,
        error,
    };
};
