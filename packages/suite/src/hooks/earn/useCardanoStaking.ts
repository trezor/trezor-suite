import { useCallback, useState } from 'react';

import { selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { CardanoAction } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDelegationCertificates,
    getStakingPath,
    getUnusedChangeAddress,
    isTestnet,
    selectBestCardanoPool,
} from '@suite-common/wallet-utils';
import trezorConnect, { CardanoCertificate } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { ActionAvailability, CardanoStaking } from 'src/types/wallet/cardanoStaking';

export const useCardanoStaking = (): CardanoStaking => {
    const account = useSelector(state => state.wallet.selectedAccount.account);

    const isCardano = account?.networkType === 'cardano';

    const cardanoStaking = useSelector(state => state.wallet.cardanoStaking);
    const cardanoPools = useSelector(selectCardanoPoolsInfo);

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

    const pendingStakeTx = cardanoStaking.pendingTx.find(tx => tx.accountKey === account?.key);

    const {
        rewards: rewardsAmount,
        address: stakeAddress,
        isActive: isStakingActive,
    } = isCardano ? account.misc.staking : {};

    const isStakingDisabled =
        (account?.availableBalance === '0' || !delegatingAvailable.status || !!pendingStakeTx) &&
        !loading;

    const prepareTxPlan = useCallback(
        async (action: CardanoAction) => {
            if (!account) return;

            const changeAddress = getUnusedChangeAddress(account);
            const stakingPath = getStakingPath(account);

            if (
                !changeAddress ||
                !account.utxo ||
                !account.addresses ||
                !rewardsAmount ||
                !stakeAddress
            )
                return null;

            const addressParameters = getAddressParameters(account, changeAddress.path);

            const selectedPool = selectBestCardanoPool(cardanoPools);

            let certificates: CardanoCertificate[] = [];

            if (action === 'delegate') {
                if (!selectedPool) {
                    return null;
                }

                certificates = getDelegationCertificates(
                    stakingPath,
                    selectedPool.hex,
                    !isStakingActive,
                );
            }

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
        },
        [account, isStakingActive, rewardsAmount, stakeAddress, cardanoPools],
    );

    const calculateFeeAndDeposit = useCallback(
        async (action: CardanoAction) => {
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

    // TODO: improve this hook for non-cardano accounts
    if (!account || account.networkType !== 'cardano') {
        return {
            isStakingDisabled: true,
            deposit: undefined,
            fee: undefined,
            loading: false,
            delegatingAvailable: { status: false },
            withdrawingAvailable: { status: false },
            isActive: false,
            rewards: '0',
            calculateFeeAndDeposit: () => Promise.resolve(),
        };
    }

    return {
        isStakingDisabled,
        deposit,
        fee,
        loading,
        delegatingAvailable,
        withdrawingAvailable,
        isActive: isStakingActive,
        rewards: rewardsAmount,
        calculateFeeAndDeposit,
    };
};
