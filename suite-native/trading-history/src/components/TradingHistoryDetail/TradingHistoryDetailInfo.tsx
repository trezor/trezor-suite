import { Card } from '@suite-native/atoms';

import { TradingHistoryDetailAssetRow } from './TradingHistoryDetailAssetRow';
import { TradingHistoryDetailMevProtectionRow } from './TradingHistoryDetailMevProtectionRow';
import { TradingHistoryDetailMinimumReceivedRow } from './TradingHistoryDetailMinimumReceivedRow';
import { TradingHistoryDetailPaymentMethodRow } from './TradingHistoryDetailPaymentMethodRow';
import { TradingHistoryDetailPlacedAtRow } from './TradingHistoryDetailPlacedAtRow';
import { TradingHistoryDetailProviderRow } from './TradingHistoryDetailProviderRow';
import { TradingHistoryDetailRateRow } from './TradingHistoryDetailRateRow';
import { TradingHistoryDetailSlippageRow } from './TradingHistoryDetailSlippageRow';
import { TradingHistoryDetailTradeIdRow } from './TradingHistoryDetailTradeIdRow';
import { useTradingHistoryDetailInfo } from '../../hooks/useTradingHistoryDetailInfo';

const TEST_ID = '@trading/history/detail/info';

type TradingHistoryDetailInfoProps = {
    orderId: string;
};

export const TradingHistoryDetailInfo = ({ orderId }: TradingHistoryDetailInfoProps) => {
    const info = useTradingHistoryDetailInfo(orderId);

    if (!info) {
        return null;
    }

    const {
        formattedMinimumReceived,
        getAsset,
        isMevProtectionEnabled,
        payAsset,
        paymentMethod,
        placedAt,
        provider,
        rateType,
        swapSlippage,
    } = info;

    return (
        <Card noPadding testID={TEST_ID}>
            {!!payAsset && <TradingHistoryDetailAssetRow asset={payAsset} isFirst side="pay" />}
            {!!getAsset && <TradingHistoryDetailAssetRow asset={getAsset} side="get" />}
            <TradingHistoryDetailTradeIdRow orderId={orderId} />
            {!!paymentMethod && (
                <TradingHistoryDetailPaymentMethodRow paymentMethod={paymentMethod} />
            )}
            {!!rateType && <TradingHistoryDetailRateRow rateType={rateType} />}
            {!!provider && <TradingHistoryDetailProviderRow provider={provider} />}
            {isMevProtectionEnabled !== undefined && (
                <TradingHistoryDetailMevProtectionRow
                    isMevProtectionEnabled={isMevProtectionEnabled}
                />
            )}
            {swapSlippage !== undefined && (
                <TradingHistoryDetailSlippageRow swapSlippage={swapSlippage} />
            )}
            {!!formattedMinimumReceived && (
                <TradingHistoryDetailMinimumReceivedRow
                    formattedMinimumReceived={formattedMinimumReceived}
                />
            )}
            <TradingHistoryDetailPlacedAtRow placedAt={placedAt} />
        </Card>
    );
};
