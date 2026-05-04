import { useSelector } from 'react-redux';

import {
    type StablecoinYieldRootState,
    selectStablecoinYieldSession,
} from '@suite-common/wallet-core';
import { Box, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type StackProps,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';
import { ReviewOutputItemList } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldReviewTransaction } from '../hooks/useYieldReviewTransaction';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const YieldSupplyTransactionDataReviewScreen = ({
    route,
}: StackProps<YieldStackParamList, YieldStackRoutes.YieldSupplyReview>) => {
    const { applyStyle } = useNativeStyles();
    const { accountKey, tokenContract } = route.params;
    const { flowKey } = useResolvedYieldFlowData({ ...route.params, displayError: false });
    const reviewTransaction = useYieldReviewTransaction({ accountKey });
    const stablecoinYieldSession = useSelector((state: StablecoinYieldRootState) =>
        flowKey ? selectStablecoinYieldSession(state, 'supply', flowKey) : undefined,
    );

    if (!reviewTransaction || stablecoinYieldSession?.step !== 'action') {
        return null;
    }

    return (
        <ConfirmOnTrezorWrapper
            closeActionType="back"
            defaultHeader={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.yieldSupplyTransactionReviewScreen.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                <ReviewOutputItemList
                    prefix="send"
                    accountKey={accountKey}
                    formState={reviewTransaction.formState}
                    tokenContract={tokenContract}
                />
                <Box style={applyStyle(spacerStyle)} />
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
