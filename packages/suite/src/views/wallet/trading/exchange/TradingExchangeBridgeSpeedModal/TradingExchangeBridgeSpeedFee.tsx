import { useIntl } from 'react-intl';

import { Translation } from '@suite/intl';
import { formatBridgeFeePercent } from '@suite-common/trading';

type TradingExchangeBridgeSpeedFeeProps = {
    feePercent: number;
};

export const TradingExchangeBridgeSpeedFee = ({
    feePercent,
}: TradingExchangeBridgeSpeedFeeProps) => {
    const { locale } = useIntl();

    if (feePercent > 0) {
        return formatBridgeFeePercent({ feePercent, locale });
    }

    return <Translation id="TR_TRADING_BRIDGE_SPEED_FEE_FREE" />;
};
