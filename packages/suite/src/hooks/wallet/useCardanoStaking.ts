import { useState, useCallback } from 'react';

import { isTestnet, getDerivationType } from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import trezorConnect, { PROTO } from '@trezor/connect';
import { addFakePendingCardanoTxThunk, selectDevice } from '@suite-common/wallet-core';

import { ActionAvailability, CardanoStaking } from 'src/types/wallet/cardanoStaking';
import { SUITE } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setPendingStakeTx } from 'src/actions/wallet/cardanoStakingActions';
import {
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getUnusedChangeAddress,
    getDelegationCertificates,
    isPoolOverSaturated,
    getStakePoolForDelegation,
    getAddressParameters,
} from 'src/utils/wallet/cardanoUtils';
import { AppState } from 'src/types/suite';

const getDeviceAvailability = (
    device: AppState['device']['selectedDevice'],
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

    const device = useSelector(selectDevice);
    const locks = useSelector(state => state.suite.locks);
    const cardanoStaking = useSelector(state => state.wallet.cardanoStaking);
    const dispatch = useDispatch();

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
    const pendingStakeTx = cardanoStaking.pendingTx.find(tx => tx.accountKey === account.key);

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
    const prepareTxPlan = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            const changeAddress = getUnusedChangeAddress(account);
            if (!changeAddress || !account.utxo || !account.addresses) return null;

            const addressParameters = getAddressParameters(account, changeAddress.path);

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

            const response = await trezorConnect.cardanoComposeTransaction({
                account: {
                    addresses: account.addresses,
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
        },
        [account, stakingPath, isStakingActive, rewardsAmount, stakeAddress, trezorPools],
    );

    const calculateFeeAndDeposit = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            setLoading(true);
            try {
                const composeRes = await prepareTxPlan(action);
                if (composeRes) {
                    if (composeRes.txPlan.type === 'error') {
                        throw new Error(composeRes.txPlan.error);
                    }
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
                    reason: err.message,
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

            const { txPlan, certificates, withdrawals } = composeRes;

            if (!txPlan || txPlan.type === 'nonfinal') return;
            if (txPlan.type === 'error') throw new Error(txPlan.error);

            const res = await trezorConnect.cardanoSignTransaction({
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
                ttl: txPlan.ttl?.toString(),
                ...(certificates.length > 0 ? { certificates } : {}),
                ...(withdrawals.length > 0 ? { withdrawals } : {}),
            });

            if (!res.success) {
                if (res.payload.error === 'tx-cancelled') return;
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: res.payload.error,
                    }),
                );
            } else {
                const sentTx = await trezorConnect.pushTransaction({
                    tx: res.payload.serializedTx,
                    coin: account.symbol,
                });

                if (sentTx.success) {
                    const { txid } = sentTx.payload;
                    dispatch(
                        notificationsActions.addToast({
                            type: 'raw-tx-sent',
                            txid,
                        }),
                    );
                    dispatch(
                        addFakePendingCardanoTxThunk({ precomposedTx: txPlan, txid, account }),
                    );
                    dispatch(setPendingStakeTx(account, txid));
                } else {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'sign-tx-error',
                            error: sentTx.payload.error,
                        }),
                    );
                }
            }
        },
        [account, device, dispatch, prepareTxPlan],
    );

    const action = useCallback(
        async (action: 'delegate' | 'withdrawal') => {
            setError(undefined);
            setLoading(true);
            try {
                await signAndPushTransaction(action);
            } catch (error) {
                if (error.message === 'UTXO_BALANCE_INSUFFICIENT') {
                    setError('AMOUNT_IS_NOT_ENOUGH');
                    dispatch(
                        notificationsActions.addToast({
                            type:
                                action === 'delegate'
                                    ? 'cardano-delegate-error'
                                    : 'cardano-withdrawal-error',
                            error: 'UTXO_BALANCE_INSUFFICIENT',
                        }),
                    );
                } else {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'sign-tx-error',
                            error: error.message,
                        }),
                    );
                }
            }
            setLoading(false);
        },
        [dispatch, signAndPushTransaction],
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
