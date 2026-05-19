import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputCard,
    ReviewOutputItemValues,
} from '@suite-native/transaction-management';

import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { buildYieldSupplyFeePreview } from '../yieldSupplyFeeUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupplyReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldSupplyReview
>;

export const YieldSupplyReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { translate } = useTranslate();
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

    if (resolutionStatus !== 'resolved' || !review) {
        return null;
    }

    return (
        <Screen
            header={
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
            <View>
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    <ReviewOutputCard
                        title={translate('earn.yieldSupplyReviewScreen.supplyCard.title')}
                        outputState="success"
                    >
                        <Text variant="body-sm" color="contentSecondary">
                            {review.amount} {tokenSymbol}
                        </Text>
                    </ReviewOutputCard>
                    <ReviewOutputCard
                        title={translate('earn.yieldSupplyReviewScreen.receiveCard.title')}
                        outputState="active"
                    >
                        <Text variant="body-sm" color="contentSecondary">
                            {review.receiptAmount} {flowData.receiptToken.symbol}
                        </Text>
                    </ReviewOutputCard>
                    <ReviewOutputCard
                        title={translate('earn.yieldSupplyReviewScreen.detailsCard.title')}
                        outputState="active"
                    >
                        <ReviewOutputItemValues
                            accountKey={route.params.accountKey}
                            value={feePreview?.fee ?? '0'}
                            translationKey="transactionManagement.review.outputs.summary.maxFee"
                        />
                    </ReviewOutputCard>
                </VStack>
            </View>
        </Screen>
    );
};
