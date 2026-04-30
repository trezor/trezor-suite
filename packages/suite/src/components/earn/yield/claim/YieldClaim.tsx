import { useCallback, useEffect, useMemo, useRef } from 'react';

import { events } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { ChainAddressKey } from '@suite-common/earn-stablecoin-api';
import {
    selectStablecoinYieldSession,
    selectStablecoinYieldTxReview,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { claimMerkleRewardsThunk } from 'src/actions/wallet/stablecoinYieldSigningThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { YieldRewardsList } from './YieldRewardsList';
import { useMerkleRewards } from '../../dashboard/yield/hooks/useMerkleRewards';
import { YieldFlowCompleteClaim } from '../common/YieldFlowCompleteClaim';
import { YieldPendingTransaction } from '../common/YieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';

type YieldClaimProps = {
    account?: Account;
};

export const YieldClaim = ({ account }: YieldClaimProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const { device } = useDevice();
    const flowKey = account?.key ?? '';
    const hasReportedSuccessRef = useRef(false);

    const yieldTxReview = useSelector(selectStablecoinYieldTxReview);
    const claimSession = useSelector(state =>
        selectStablecoinYieldSession(state, 'claim', flowKey),
    );
    const isClaiming =
        claimSession.action.isSubmitting ||
        (!!yieldTxReview.precomposedTx && yieldTxReview.accountKey === account?.key);
    const isDeviceConnected = !!device?.connected && device.available;
    const isEthereumAccount = account?.symbol === 'eth';

    const merkleRewardsSources = useMemo(
        () =>
            account && isEthereumAccount
                ? [{ networkSymbol: account.symbol, address: account.descriptor }]
                : [],
        [account, isEthereumAccount],
    );

    const { merkleRewardsQuery } = useMerkleRewards(merkleRewardsSources);
    const { rewards } = merkleRewardsQuery.data;

    const claimableRewards = useMemo(() => {
        if (!account || !isEthereumAccount || !merkleRewardsQuery.isSuccess) return [];

        return Object.entries(rewards)
            .filter(([key]) => {
                const { address } = ChainAddressKey.parse(key);

                return address.toLowerCase() === account.descriptor.toLowerCase();
            })
            .flatMap(([, rewardList]) =>
                rewardList.filter(reward => new BigNumber(reward.claimable).gt(0)),
            );
    }, [account, isEthereumAccount, merkleRewardsQuery.isSuccess, rewards]);

    useEffect(() => {
        if (!flowKey) {
            return;
        }

        dispatch(stablecoinYieldActions.initSession({ flowType: 'claim', flowKey }));
    }, [dispatch, flowKey]);

    useYieldPendingTransactionTracking({
        account,
        flowType: 'claim',
        flowKey,
    });

    const handleClaim = async () => {
        if (!account || !flowKey || !isDeviceConnected || claimableRewards.length === 0) return;

        analytics.report({
            type: events.yieldClaimEvent.name,
            payload: {
                action: 'continue',
                type: 'claim',
                networkSymbol: account.symbol,
            },
        });

        try {
            await dispatch(
                claimMerkleRewardsThunk({ account, flowKey, rewards: claimableRewards }),
            ).unwrap();
        } catch {
            // cancelled or rejected — isClaiming resets via Redux (discardTransaction in finally)
        }
    };

    const handleTxClick = useCallback(
        (txid: string) => {
            if (!account) return;

            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    deviceState: account.deviceState,
                    flow: 'detail',
                }),
            );
        },
        [account, dispatch],
    );

    useEffect(() => {
        if (claimSession.step !== 'complete' || hasReportedSuccessRef.current) {
            return;
        }

        analytics.report({
            type: events.yieldClaimEvent.name,
            payload: {
                action: 'continue',
                type: 'success',
                networkSymbol: account?.symbol,
            },
        });

        hasReportedSuccessRef.current = true;
    }, [account?.symbol, analytics, claimSession.step]);

    if (!account) {
        return null;
    }

    if (claimSession.step === 'complete') {
        return (
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <YieldFlowCompleteClaim rewards={claimableRewards} />
                </Column>
            </Column>
        );
    }

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_CLAIM_REWARDS" />
                </Text>

                <Card>
                    <Column gap={24}>
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_STAKE_REWARDS" />
                        </Text>

                        <YieldRewardsList
                            rewards={claimableRewards}
                            isLoading={merkleRewardsQuery.isLoading}
                        />
                    </Column>
                </Card>

                {merkleRewardsQuery.isSuccess &&
                    claimableRewards.length > 0 &&
                    !claimSession.action.pendingTransaction && (
                        <Banner
                            intent="warning"
                            icon="warning"
                            description={<Translation id="TR_EARN_REWARDS_NETWORK_FEE_WARNING" />}
                        />
                    )}

                <Button
                    size="large"
                    width="100%"
                    isDisabled={
                        merkleRewardsQuery.isLoading ||
                        claimableRewards.length === 0 ||
                        isClaiming ||
                        !isDeviceConnected
                    }
                    isLoading={isClaiming}
                    onClick={handleClaim}
                >
                    <Translation id="TR_EARN_YIELD_CLAIM" />
                </Button>
                {claimSession.action.pendingTransaction && (
                    <YieldPendingTransaction
                        pendingTransaction={claimSession.action.pendingTransaction}
                        onTxClick={handleTxClick}
                    />
                )}
            </Column>
        </Column>
    );
};
