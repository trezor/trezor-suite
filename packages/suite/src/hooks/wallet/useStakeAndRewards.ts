import { useDispatch, useSelector } from '../suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useEffect, useState } from 'react';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { getEthNetworkForWalletSdk } from 'src/utils/suite/stake';
import { notificationsActions } from '@suite-common/toast-notifications';
import BigNumber from 'bignumber.js';
import { STAKE_SYMBOLS } from 'src/constants/suite/staking';

// TODO: Move to Redux. For demo and testing purposes only, since it requests data every time it's called.
//  This data should be retrieved either via Blockbook or added to account info in Redux in some other way.
export const useStakeAndRewards = () => {
    const dispatch = useDispatch();
    const selectedAccount = useSelector(selectSelectedAccount);
    const canStake = selectedAccount?.symbol
        ? STAKE_SYMBOLS.includes(selectedAccount?.symbol)
        : false;

    // Autocompound stake balance + rewards
    const [stakeWithRewards, setStakeWithRewards] = useState(new BigNumber(0));
    useEffect(() => {
        if (!selectedAccount || !canStake) return;

        const getStakeWithRewards = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.autocompoundBalanceOf(selectedAccount.descriptor);

                setStakeWithRewards(response);
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getStakeWithRewards();
    }, [canStake, dispatch, selectedAccount, selectedAccount?.descriptor]);

    const [originalStake, setOriginalStake] = useState(new BigNumber(0));
    useEffect(() => {
        if (!selectedAccount || !canStake) return;

        const getOriginalStake = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.depositedBalanceOf(selectedAccount.descriptor);

                setOriginalStake(response);
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getOriginalStake();
    }, [canStake, dispatch, selectedAccount, selectedAccount?.descriptor]);

    const [pendingStake, setPendingStake] = useState(new BigNumber(0));
    useEffect(() => {
        if (!selectedAccount || !canStake) return;

        const getPendingStake = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.pendingBalanceOf(selectedAccount.descriptor);

                setPendingStake(response);
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getPendingStake();
    }, [canStake, dispatch, selectedAccount, selectedAccount?.descriptor]);

    const [pendingDepositedStake, setPendingDepositedStake] = useState(new BigNumber(0));
    useEffect(() => {
        if (!selectedAccount || !canStake) return;

        const getPendingDepositedStake = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.pendingDepositedBalanceOf(
                    selectedAccount.descriptor,
                );

                setPendingDepositedStake(response);
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getPendingDepositedStake();
    }, [canStake, dispatch, selectedAccount, selectedAccount?.descriptor]);

    const [rewards, setRewards] = useState(new BigNumber(0));
    useEffect(() => {
        if (!selectedAccount || !canStake) return;

        const getRewards = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.restakedRewardOf(selectedAccount.descriptor);

                setRewards(response);
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getRewards();
    }, [canStake, dispatch, selectedAccount, selectedAccount?.descriptor]);

    const totalPendingStake = pendingStake.plus(pendingDepositedStake);

    return {
        stakeWithRewards,
        originalStake,
        pendingStake,
        pendingDepositedStake,
        totalPendingStake,
        rewards,
    };
};
