import { useCallback, useEffect, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { Context } from '@suite-common/message-system';
import {
    isStablecoinYieldSupported,
    selectStablecoinYieldSession,
    selectStablecoinYieldTxReview,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Text } from '@trezor/components';

import { selectIsConnectionModalOpen } from 'src/actions/device/deviceSelectors';
import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { claimMerklRewardsThunk } from 'src/actions/wallet/stablecoin-yield';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

import { YieldRewardsList } from './YieldRewardsList';
import { useMerklRewards } from './hooks';
import { YieldDisabledBanner } from '../common/YieldDisabledBanner';
import { YieldFlowCompleteClaim } from '../common/YieldFlowCompleteClaim';
import { YieldPendingTransaction } from '../common/YieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';

type YieldClaimProps = {
    account: Account;
};

export const YieldClaim = ({ account }: YieldClaimProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { translationString } = useTranslation();
    const flowKey = account.key;
    const { isDisabled, content, variant } = useMessageSystemYield('claim');
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const [isAwaitingConnectionForFwUpdate, setIsAwaitingConnectionForFwUpdate] = useState(false);

    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const yieldTxReview = useSelector(selectStablecoinYieldTxReview);
    const claimSession = useSelector(state =>
        selectStablecoinYieldSession(state, 'claim', flowKey),
    );
    const isClaimSubmitting =
        claimSession.action.isSubmitting ||
        (!!yieldTxReview.precomposedTx && yieldTxReview.accountKey === account.key);
    const isClaiming = isClaimSubmitting || !!claimSession.action.pendingTransaction;
    const isDeviceConnected = !!device?.connected && device.available;
    const isClaimFirmwareOutdated = !isStablecoinYieldSupported(device, 'claim');

    const { merklRewardsQuery, missingRateTickersQuery } = useMerklRewards(account);
    const accountRewards: YieldAccountRewards | undefined =
        merklRewardsQuery.data?.accountsRewards[0];
    const isRewardsLoading = merklRewardsQuery.isLoading || missingRateTickersQuery.isLoading;

    useEffect(() => {
        dispatch(stablecoinYieldActions.initSession({ flowType: 'claim', flowKey }));

        return () => {
            dispatch(stablecoinYieldActions.disposeSession({ flowType: 'claim', flowKey }));
        };
    }, [dispatch, flowKey]);

    useEffect(() => {
        if (isAwaitingConnectionForFwUpdate && !isConnectionModalOpen) {
            setIsAwaitingConnectionForFwUpdate(false);
            if (device?.connected) {
                setIsFirmwareModalOpen(false);
                dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
            }
        }
    }, [isAwaitingConnectionForFwUpdate, isConnectionModalOpen, device?.connected, dispatch]);

    useYieldPendingTransactionTracking({
        account,
        flowType: 'claim',
        flowKey,
        waitForMerklToResolveClaim: merklRewardsQuery.waitForMerklToResolveClaim,
    });

    const handleClaim = async () => {
        if (!accountRewards) return;

        if (isClaimFirmwareOutdated) {
            setIsFirmwareModalOpen(true);

            return;
        }

        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        const { account, rewards } = accountRewards;

        analytics.report({
            type: events.yieldClaimEvent.name,
            payload: {
                action: 'continue',
                type: 'claim',
                networkSymbol: account.symbol,
                rewardCount: rewards.length,
            },
        });

        try {
            await dispatch(claimMerklRewardsThunk({ account, flowKey, rewards })).unwrap();
        } catch {
            // cancelled or rejected — isClaiming resets via Redux (discardTransaction in finally)
        }
    };

    const handleFirmwareModalClose = () => {
        setIsFirmwareModalOpen(false);
        setIsAwaitingConnectionForFwUpdate(false);
    };

    const handleFirmwareUpdate = () => {
        if (!device?.connected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            setIsAwaitingConnectionForFwUpdate(true);
            dispatch(setConnectionModal(true));

            return;
        }

        setIsFirmwareModalOpen(false);
        dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
    };

    const handleTxClick = useCallback(
        (txid: string) => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'pending-tx-open',
                    value: 'claim',
                    networkSymbol: account.symbol,
                },
            });

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
        [account, analytics, dispatch],
    );

    if (claimSession.step === 'complete' && accountRewards) {
        return (
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <YieldFlowCompleteClaim accountRewards={accountRewards} />
                </Column>
            </Column>
        );
    }

    return (
        <Column width="100%" alignItems="center">
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={handleFirmwareModalClose}
                    onUpdate={handleFirmwareUpdate}
                    featureName={translationString('TR_EARN_STABLECOIN_YIELD_TITLE')}
                />
            )}
            <Column gap={24} width="100%" maxWidth={500}>
                <ContextMessage context={Context.getEarnYield('claim')} />

                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_CLAIM_REWARDS" />
                </Text>

                {isDisabled ? (
                    <YieldDisabledBanner type="claim" content={content} variant={variant} />
                ) : (
                    <>
                        <Card>
                            <Column gap={24}>
                                <Text typographyStyle="body-md-strong">
                                    <Translation id="TR_STAKE_REWARDS" />
                                </Text>

                                <YieldRewardsList
                                    accountRewards={accountRewards}
                                    isLoading={isRewardsLoading}
                                />
                            </Column>
                        </Card>

                        {merklRewardsQuery.isSuccess &&
                            (accountRewards?.rewards?.length ?? 0) > 0 &&
                            !claimSession.action.pendingTransaction && (
                                <Banner
                                    intent="warning"
                                    icon="warning"
                                    description={
                                        <Translation id="TR_EARN_REWARDS_NETWORK_FEE_WARNING" />
                                    }
                                />
                            )}

                        <Button
                            size="large"
                            width="100%"
                            isDisabled={
                                isRewardsLoading || !accountRewards?.rewards.length || isClaiming
                            }
                            isLoading={isClaimSubmitting || merklRewardsQuery.isLoading}
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
                    </>
                )}
            </Column>
        </Column>
    );
};
