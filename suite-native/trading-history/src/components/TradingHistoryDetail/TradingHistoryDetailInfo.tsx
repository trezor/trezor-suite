import { Card } from '@suite-native/atoms';

import { TradingHistoryDetailAssetRow } from './TradingHistoryDetailAssetRow';
import { TradingHistoryDetailMetadata } from './TradingHistoryDetailMetadata';
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

    return (
        <Card noPadding testID={TEST_ID}>
            {!!info.payAsset && (
                <TradingHistoryDetailAssetRow asset={info.payAsset} isFirst side="pay" />
            )}
            {!!info.getAsset && <TradingHistoryDetailAssetRow asset={info.getAsset} side="get" />}
            <TradingHistoryDetailMetadata
                formattedMinimumReceived={info.formattedMinimumReceived}
                isMevProtectionEnabled={info.isMevProtectionEnabled}
                orderId={orderId}
                paymentMethod={info.paymentMethod}
                placedAt={info.placedAt}
                provider={info.provider}
                rateType={info.rateType}
                swapSlippage={info.swapSlippage}
            />
        </Card>
    );
};
