import { TradingType } from '@suite-common/trading';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { ReviewOutputItemList } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReviewOutputsFooter } from '../components/reviewOutputs/ReviewOutputsFooter';
import { ReviewOutputsSkeleton } from '../components/reviewOutputs/ReviewOutputsSkeleton';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import type { UseTradingTransactionReturnProps } from '../hooks/general/useTradingTransaction';
import { useDelayedReviewOutputListDisplayFlag } from '../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag';
import {
    UseTradingOutputsReviewScreenControlsProps,
    useTradingOutputsReviewScreenControls,
} from '../hooks/reviewOutputs/useTradingOutputsReviewScreenControls';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { getFormDraftKeyPrefixFromTradingType } from '../utils/general/utils';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

type TradingOutputsBaseReviewScreenProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    orderId: string;
    tradingType: TradingType;
};

type TradingOutputsReviewScreenParams = UseTradingOutputsReviewScreenControlsProps &
    TradingOutputsBaseReviewScreenProps &
    Pick<
        UseTradingTransactionReturnProps,
        'isTransactionSendConsentRequested' | 'resolveTransactionSendConsent'
    >;

export const TradingOutputsBaseReviewScreen = ({
    accountKey,
    tokenContract,
    orderId,
    tradingType,
    signAndSendTransaction,
    isTransactionSendConsentRequested,
    resolveTransactionSendConsent,
}: TradingOutputsReviewScreenParams) => {
    const { applyStyle } = useNativeStyles();
    const { isTransactionAlreadySigned, confirmOnTrezorRef } =
        useTradingOutputsReviewScreenControls({
            orderId,
            accountKey,
            signAndSendTransaction,
        });
    const shouldDisplayReviewList = useDelayedReviewOutputListDisplayFlag();

    const prefix = getFormDraftKeyPrefixFromTradingType(tradingType);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradingReviewOutputs.title" />}
                    closeActionType="close"
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                {shouldDisplayReviewList ? (
                    <ReviewOutputItemList
                        prefix={prefix}
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                ) : (
                    <ReviewOutputsSkeleton />
                )}
                {isTransactionAlreadySigned ? (
                    <ReviewOutputsFooter
                        isConsentRequested={isTransactionSendConsentRequested}
                        resolveConsent={resolveTransactionSendConsent}
                        testID="@trading/outputs-review/footer"
                    />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

export const TradingExchangeOutputsReviewScreen = ({
    accountKey,
    tokenContract,
    orderId,
    tradingType,
}: TradingOutputsBaseReviewScreenProps) => {
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useExchangeFlow();

    return (
        <TradingOutputsBaseReviewScreen
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType={tradingType}
            signAndSendTransaction={signAndSendTransaction}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
        />
    );
};

export const TradingSellOutputsReviewScreen = ({
    accountKey,
    tokenContract,
    orderId,
    tradingType,
}: TradingOutputsBaseReviewScreenProps) => {
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested,
        resolveTransactionSendConsent,
    } = useSellFlow();

    return (
        <TradingOutputsBaseReviewScreen
            accountKey={accountKey}
            tokenContract={tokenContract}
            orderId={orderId}
            tradingType={tradingType}
            signAndSendTransaction={signAndSendTransaction}
            isTransactionSendConsentRequested={isTransactionSendConsentRequested}
            resolveTransactionSendConsent={resolveTransactionSendConsent}
        />
    );
};

export const TradingOutputsReviewScreen = ({
    route,
}: StackProps<TradingStackParamList, TradingStackRoutes.TradingOutputsReview>) => {
    const { tradingType, accountKey, tokenContract, orderId } = route.params;

    if (tradingType === 'exchange') {
        return (
            <TradingExchangeOutputsReviewScreen
                accountKey={accountKey}
                tokenContract={tokenContract}
                orderId={orderId}
                tradingType={tradingType}
            />
        );
    }
    if (tradingType === 'sell') {
        return (
            <TradingSellOutputsReviewScreen
                accountKey={accountKey}
                tokenContract={tokenContract}
                orderId={orderId}
                tradingType={tradingType}
            />
        );
    }

    return null;
};
