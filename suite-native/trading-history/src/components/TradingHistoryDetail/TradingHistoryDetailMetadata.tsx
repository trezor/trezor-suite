import { useFormatters } from '@suite-common/formatters';
import { HStack, Text } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    ExplanationText,
    PaymentMethodDisplay,
    ProviderDisplay,
    TradeInfoRow,
} from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import {
    type TradingHistoryDetailPaymentMethod,
    type TradingHistoryDetailProvider,
    type TradingHistoryDetailRateType,
} from '../../hooks/useTradingHistoryDetailInfo';

const TEST_ID = '@trading/history/detail/info';

const tradeIdStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    textDecorationLine: 'underline',
}));

type TradingHistoryDetailMetadataProps = {
    formattedMinimumReceived?: string;
    isMevProtectionEnabled?: boolean;
    orderId: string;
    paymentMethod?: TradingHistoryDetailPaymentMethod;
    placedAt: Date;
    provider?: TradingHistoryDetailProvider;
    rateType?: TradingHistoryDetailRateType;
    swapSlippage?: string;
};

export const TradingHistoryDetailMetadata = ({
    formattedMinimumReceived,
    isMevProtectionEnabled,
    orderId,
    paymentMethod,
    placedAt,
    provider,
    rateType,
    swapSlippage,
}: TradingHistoryDetailMetadataProps) => {
    const { applyStyle } = useNativeStyles();
    const { DateTimeFormatter } = useFormatters();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();

    const handleCopyTradeId = async () => {
        await copyToClipboard(orderId, translate('generic.savedToClipboard'));
    };

    return (
        <>
            <TradeInfoRow spacing="sp40" onPress={handleCopyTradeId} testID={`${TEST_ID}/trade-id`}>
                <Text color="contentSecondary" variant="body-sm">
                    <Translation id="moduleTrading.tradeHistory.detail.info.tradeId" />
                </Text>
                <HStack alignItems="center" flexShrink={1} spacing={0}>
                    <Text
                        variant="body-sm"
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={applyStyle(tradeIdStyle)}
                    >
                        {orderId}
                    </Text>
                    <Icon name="copy" size="medium" />
                </HStack>
            </TradeInfoRow>
            {!!paymentMethod && (
                <TradeInfoRow>
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation
                            id={
                                paymentMethod.label === 'payment'
                                    ? 'moduleTrading.tradeHistory.detail.info.paymentMethod'
                                    : 'moduleTrading.tradeHistory.detail.info.payoutMethod'
                            }
                        />
                    </Text>
                    <PaymentMethodDisplay
                        accessibilityLabel={
                            paymentMethod.paymentMethodName ?? paymentMethod.paymentMethod
                        }
                        iconSize={24}
                        paymentMethod={paymentMethod.paymentMethod}
                        paymentMethodName={paymentMethod.paymentMethodName}
                        spacing="sp8"
                    />
                </TradeInfoRow>
            )}
            {!!rateType && (
                <TradeInfoRow>
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation id="moduleTrading.tradeHistory.detail.info.rate" />
                    </Text>
                    <ExplanationText
                        priority="primary"
                        title={
                            <Translation
                                id={
                                    rateType === 'fixed'
                                        ? 'moduleTrading.tradeHistory.detail.info.explanation.fixedRate.title'
                                        : 'moduleTrading.tradeHistory.detail.info.explanation.floatingRate.title'
                                }
                            />
                        }
                        description={
                            <Translation
                                id={
                                    rateType === 'fixed'
                                        ? 'moduleTrading.tradeHistory.detail.info.explanation.fixedRate.description'
                                        : 'moduleTrading.tradeHistory.detail.info.explanation.floatingRate.description'
                                }
                            />
                        }
                        testID={`${TEST_ID}/rate`}
                    >
                        <Translation
                            id={
                                rateType === 'fixed'
                                    ? 'moduleTrading.tradeHistory.detail.info.fixed'
                                    : 'moduleTrading.tradeHistory.detail.info.floating'
                            }
                        />
                    </ExplanationText>
                </TradeInfoRow>
            )}
            {!!provider && (
                <TradeInfoRow>
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation id="moduleTrading.tradeHistory.detail.info.provider" />
                    </Text>
                    <ProviderDisplay
                        logo={provider.logo}
                        logoSize="body-md"
                        providerName={provider.name}
                    />
                </TradeInfoRow>
            )}
            {isMevProtectionEnabled !== undefined && (
                <TradeInfoRow>
                    <ExplanationText
                        title={
                            <Translation id="moduleTrading.tradeHistory.detail.info.mevProtection" />
                        }
                        description={
                            <Translation id="moduleTrading.tradeHistory.detail.info.explanation.mevProtection.description" />
                        }
                        testID={`${TEST_ID}/mev-explanation`}
                    >
                        <Translation id="moduleTrading.tradeHistory.detail.info.mevProtection" />
                    </ExplanationText>
                    <Icon
                        color="contentPrimary"
                        name={isMevProtectionEnabled ? 'check' : 'x'}
                        size="large"
                        testID={`${TEST_ID}/mev-${isMevProtectionEnabled ? 'enabled' : 'disabled'}`}
                    />
                </TradeInfoRow>
            )}
            {swapSlippage !== undefined && (
                <TradeInfoRow>
                    <ExplanationText
                        title={
                            <Translation id="moduleTrading.tradeHistory.detail.info.maximumSlippage" />
                        }
                        description={
                            <Translation id="moduleTrading.tradeHistory.detail.info.explanation.maximumSlippage.description" />
                        }
                        testID={`${TEST_ID}/slippage-explanation`}
                    >
                        <Translation id="moduleTrading.tradeHistory.detail.info.maximumSlippage" />
                    </ExplanationText>
                    <Text variant="body-sm">{swapSlippage}%</Text>
                </TradeInfoRow>
            )}
            {!!formattedMinimumReceived && (
                <TradeInfoRow>
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation id="moduleTrading.tradeHistory.detail.info.minimumReceivedAmount" />
                    </Text>
                    <Text variant="body-sm">{formattedMinimumReceived}</Text>
                </TradeInfoRow>
            )}
            <TradeInfoRow>
                <Text color="contentSecondary" variant="body-sm">
                    <Translation id="moduleTrading.tradeHistory.detail.info.placed" />
                </Text>
                <Text variant="body-sm">
                    <DateTimeFormatter value={placedAt} />
                </Text>
            </TradeInfoRow>
        </>
    );
};
