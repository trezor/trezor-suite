import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal, toTokenSymbol } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldReviewList } from '../components/YieldReviewList';
import { buildYieldDepositReviewCards } from '../components/YieldReviewListPresets';
import { YieldReviewScreenLayout } from '../components/YieldReviewScreenLayout';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldDepositReview } from '../hooks/useYieldDepositReview';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';
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
    const { translate } = useTranslate();
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();
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

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isDepositSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: depositStatus === 'idle',
        startReview: startDepositReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId="earn.yieldDepositReviewScreen.title"
            submittedCard={
                isDepositSigned ? (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.yieldDepositReviewScreen.submitButton"
                        isButtonLoading={isSendingDeposit}
                        messageTranslationId="earn.yieldDepositReviewScreen.successMessage"
                        onButtonPress={handleDepositSubmitted}
                    />
                ) : undefined
            }
        >
            <YieldReviewList
                cards={buildYieldDepositReviewCards(
                    {
                        accountKey: flowData.account.key,
                        amount: review.amount,
                        fee: feePreview.fee,
                        receiveAmount: review.receiptAmount,
                        receiveTokenSymbol: toTokenSymbol(flowData.receiptToken.symbol),
                        tokenSymbol: toTokenSymbol(tokenSymbol),
                    },
                    translate,
                )}
                isSigned={isDepositSigned}
                networkSymbol={flowData.account.symbol}
            />
        </YieldReviewScreenLayout>
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
    const review = session?.action.review?.type === 'deposit' ? session.action.review : null;
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
