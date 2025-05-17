import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';

type TradeDetailFooterProps = {
    orderId: string;
};

export const TradeDetailFooter = ({ orderId }: TradeDetailFooterProps) => {
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

    return (
        <Card>
            <VStack spacing="sp12">
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
            </VStack>
        </Card>
    );
};
