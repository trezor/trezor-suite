import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { Box, CircularSpinner, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { isFinalStatus } from '../../../utils/tradeUtils';
import { TradeStatusBadge } from '../TradeHistory/TradeStatusBadge';

type TradeDetailHeaderProps = {
    orderId: string;
};

const iconWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.round,
    padding: utils.spacings.sp12,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const TradeDetailHeader = ({ orderId }: TradeDetailHeaderProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    if (!trade) {
        return null;
    }

    const isInProgress = !isFinalStatus(trade.tradeType, trade.data.status);

    return (
        <VStack spacing="sp16" alignItems="center" justifyContent="center">
            <Box style={applyStyle(iconWrapperStyle)}>
                <Icon name="arrowsLeftRight" size="extraLarge" />
                {isInProgress && (
                    <CircularSpinner
                        size={utils.spacings.sp56}
                        color="backgroundAlertYellowBold"
                        width={3}
                    />
                )}
            </Box>
            <TradeStatusBadge status={trade?.data.status} />
        </VStack>
    );
};
