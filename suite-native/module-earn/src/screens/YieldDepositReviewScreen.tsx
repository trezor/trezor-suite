import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal, toTokenSymbol } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldDepositReviewOutputList } from '../components/YieldDepositReviewOutputList';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldDepositReview } from '../hooks/useYieldDepositReview';
import { useYieldReviewAutoStart } from '../hooks/useYieldReviewAutoStart';
import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositReview
>;

type DepositReviewContentProps = {
    feePreview: PrecomposedTransactionFinal;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    review: {
        amount: string;
        receiptAmount: string;
    };
    tokenSymbol: string;
};

const DepositReviewContent = ({
    feePreview,
    flowData,
    flowKey,
    review,
    tokenSymbol,
}: DepositReviewContentProps) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const hasLeftReviewRef = useRef(false);
    const markReviewLeave = useCallback(() => {
        hasLeftReviewRef.current = true;
    }, []);
    const {
        depositStatus,
        handleDepositSubmitted,
        leaveReviewFromDeviceCancel,
        startDepositReview,
    } = useYieldDepositReview({
        flowData,
        flowKey,
        onReviewLeave: markReviewLeave,
    });
    const isDepositSigned = depositStatus === 'signed' || depositStatus === 'sending';
    const isSendingDeposit = depositStatus === 'sending';
    const handleReviewCancelled = useCallback(() => {
        if (hasLeftReviewRef.current) {
            return;
        }

        leaveReviewFromDeviceCancel();
    }, [leaveReviewFromDeviceCancel]);

    useYieldReviewAutoStart({
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onReviewCancelled: handleReviewCancelled,
        onReviewFailed: closeSheet,
        shouldAutoStartReview: depositStatus === 'idle',
        startReview: startDepositReview,
    });

    useEffect(() => {
        if (isDepositSigned) {
            closeSheet();
        }
    }, [closeSheet, isDepositSigned]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="back"
            defaultHeader={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.yieldDepositReviewScreen.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <YieldDepositReviewOutputList
                    accountKey={flowData.account.key}
                    amount={review.amount}
                    fee={feePreview.fee}
                    isSigned={isDepositSigned}
                    networkSymbol={flowData.account.symbol}
                    receiveAmount={review.receiptAmount}
                    receiveTokenSymbol={toTokenSymbol(flowData.receiptToken.symbol)}
                    tokenSymbol={toTokenSymbol(tokenSymbol)}
                />
                {isDepositSigned && (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.yieldDepositReviewScreen.submitButton"
                        isButtonLoading={isSendingDeposit}
                        messageTranslationId="earn.yieldDepositReviewScreen.successMessage"
                        onButtonPress={handleDepositSubmitted}
                    />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

export const YieldDepositReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { flowData, flowKey, tokenSymbol, resolutionStatus } = useResolvedYieldFlowData(
        route.params,
    );
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'deposit', flowKey),
    );
    const review = session?.action.review;
    const feePreview = useMemo(
        () => (review ? buildYieldDepositFeePreview(review.unsignedTransaction) : null),
        [review],
    );

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);

            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !review || !feePreview) {
        return null;
    }

    return (
        <DepositReviewContent
            feePreview={feePreview}
            flowData={flowData}
            flowKey={flowKey}
            review={review}
            tokenSymbol={tokenSymbol}
        />
    );
};
