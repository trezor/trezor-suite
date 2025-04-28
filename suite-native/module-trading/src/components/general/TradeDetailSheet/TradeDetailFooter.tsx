import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';

import { TradeDetailPaymentButton } from './TradeDetailPaymentButton';
import { TradeDetailProviderSupportButton } from './TradeDetailProviderSupportButton';
import { getTradeStatusStep } from '../../../utils/tradeUtils';

type TradeDetailFooterProps = {
    orderId: string;
    onOpenedWebview: () => void;
};

export const TradeDetailFooter = ({ orderId, onOpenedWebview }: TradeDetailFooterProps) => {
    const { translate } = useTranslate();

    const copyToClipboard = useCopyToClipboard();

    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    if (!trade) {
        return null;
    }

    const handleCopyOrderIdPress = async () => {
        await copyToClipboard(orderId, translate('generic.savedToClipboard'));
    };

    const statusStep = getTradeStatusStep(trade);

    return (
        <Card>
            <VStack spacing="sp12">
                {statusStep === 'status-error' && (
                    <>
                        <TradeDetailProviderSupportButton
                            provider={trade.data.exchange ?? ''}
                            tradeType={trade.tradeType}
                        />

                        <Box>
                            <Text color="textSubdued">
                                <Translation id="moduleTrading.tradeHistory.detail.orderId" />
                            </Text>
                            <Text>{orderId}</Text>
                        </Box>

                        <Button
                            viewLeft="copy"
                            colorScheme="tertiaryElevation0"
                            onPress={handleCopyOrderIdPress}
                        >
                            <Translation id="generic.buttons.copy" />
                        </Button>
                    </>
                )}

                {statusStep === 'status-waiting' && trade.data.orderId && (
                    <TradeDetailPaymentButton
                        orderId={trade.data.orderId}
                        onOpenedWebview={onOpenedWebview}
                    />
                )}
            </VStack>
        </Card>
    );
};
