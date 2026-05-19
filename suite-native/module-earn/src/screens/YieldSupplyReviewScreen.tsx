import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
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
import { YieldReviewList } from '../components/YieldReviewList';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldSupplyReview } from '../hooks/useYieldSupplyReview';
import { buildYieldSupplyFeePreview } from '../yieldSupplyFeeUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupplyReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldSupplyReview
>;

type SupplyReviewContentProps = {
    feePreview: PrecomposedTransactionFinal;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    review: {
        amount: string;
        receiptAmount: string;
    };
    tokenSymbol: string;
};

const SupplyReviewContent = ({
    feePreview,
    flowData,
    flowKey,
    review,
    tokenSymbol,
}: SupplyReviewContentProps) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { supplyStatus, handleSubmitSupplyReview, handleSupplySubmitted } =
        useYieldSupplyReview({
            flowData,
            flowKey,
        });
    const isSigningSupply = supplyStatus === 'signing';
    const isSupplySigned = supplyStatus === 'signed' || supplyStatus === 'sending';
    const isSendingSupply = supplyStatus === 'sending';
    const isSubmitDisabled = supplyStatus !== 'idle';

    useEffect(() => {
        if (isSigningSupply) {
            revealConfirmOnTrezorSheet();
        } else {
            closeSheet();
        }
    }, [closeSheet, isSigningSupply, revealConfirmOnTrezorSheet]);

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
                            <Translation id="earn.yieldSupplyReviewScreen.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <YieldReviewList
                    accountKey={flowData.account.key}
                    amount={review.amount}
                    fee={feePreview.fee}
                    isFooterVisible={!isSigningSupply && !isSupplySigned}
                    isSubmitDisabled={isSubmitDisabled}
                    isSubmitLoading={isSigningSupply}
                    onSubmit={handleSubmitSupplyReview}
                    receiveAmount={review.receiptAmount}
                    receiveTokenSymbol={flowData.receiptToken.symbol}
                    tokenSymbol={tokenSymbol}
                    variant="supply"
                />
                {isSupplySigned && (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="earn.yieldSupplyReviewScreen.submitButton"
                        isButtonLoading={isSendingSupply}
                        messageTranslationId="earn.yieldSupplyReviewScreen.successMessage"
                        onButtonPress={handleSupplySubmitted}
                    />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

export const YieldSupplyReviewScreen = () => {
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
        () => (review ? buildYieldSupplyFeePreview(review.unsignedTransaction) : null),
        [review],
    );

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldSupply, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !review || !feePreview) {
        return null;
    }

    return (
        <SupplyReviewContent
            feePreview={feePreview}
            flowData={flowData}
            flowKey={flowKey}
            review={review}
            tokenSymbol={tokenSymbol}
        />
    );
};
