import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, LottieAnimation, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackProps,
    TransactionDetailStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectIsTransactionReviewInProgress,
    sendArrowsLottie,
} from '@suite-native/transaction-management';

import { ClaimTransactionDataReviewStepList } from '../components/ClaimTransactionDataReviewStepList';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { getEarnPostSignParentRoute } from '../utils';

const navigateToClaimedTransactionAction = ({
    accountKey,
    symbol,
    txid,
}: {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    txid: string;
}) =>
    CommonActions.reset({
        index: 2,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: { screen: AppTabsRoutes.EarnStack },
            },
            getEarnPostSignParentRoute(symbol, accountKey),
            {
                name: RootStackRoutes.TransactionDetailStack,
                params: {
                    screen: TransactionDetailStackRoutes.TransactionDetail,
                    params: {
                        accountKey,
                        txid,
                        closeActionType: 'close',
                    },
                },
            },
        ],
    });

export const ClaimTransactionDataReviewScreen = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey } = route.params;
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const [isPushing, setIsPushing] = useState(false);

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'claim', accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { handleSign, handlePush } = useHandleOnEarnTransactionReview({
        accountKey,
        stakeType: 'claim',
    });

    // Once signed, the user reviews the summary and taps "Claim now" to broadcast the transaction.
    const isReadyToClaim = isTransactionAlreadySigned && !!account;

    useEffect(() => {
        if (isTransactionReviewInProgress) {
            revealConfirmOnTrezorSheet();
        }
    }, [isTransactionReviewInProgress, revealConfirmOnTrezorSheet]);

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    const handleClaimNow = useCallback(async () => {
        setIsPushing(true);

        const txid = await handlePush();

        if (txid && account) {
            navigation.dispatch(
                navigateToClaimedTransactionAction({ accountKey, symbol: account.symbol, txid }),
            );

            return;
        }

        setIsPushing(false);
    }, [handlePush, account, accountKey, navigation]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.claimTransactionDataReviewScreen.title" />
                        </Text>
                    }
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    <ClaimTransactionDataReviewStepList onSign={handleSign} />
                </VStack>
                {isReadyToClaim && (
                    <Card>
                        <VStack
                            paddingTop="sp8"
                            paddingHorizontal="sp24"
                            paddingBottom="sp24"
                            alignItems="center"
                            spacing="sp24"
                        >
                            <LottieAnimation source={sendArrowsLottie} size="small" />
                            <Text variant="body-md-strong" textAlign="center">
                                <Translation id="earn.claimTransactionDataReviewScreen.successMessage" />
                            </Text>
                        </VStack>
                        <Button
                            isLoading={isPushing}
                            onPress={handleClaimNow}
                            testID="@earn/claim-now"
                        >
                            <Translation id="earn.claimTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </Card>
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
