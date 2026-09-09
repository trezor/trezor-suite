import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { Button, Illustration } from '@trezor/components';

import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingBuyDetailPaymentFailedProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingBuyDetailPaymentFailed = ({
    trade,
    provider,
}: TradingBuyDetailPaymentFailedProps) => {
    const { dispatch } = useServices(selectDispatch);

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));

    return (
        <TradingDetailTerminalState
            artwork={<Illustration name="tradeFailure" intent="critical" width={120} />}
            title={<Translation id="TR_BUY_DETAIL_FAILED_TITLE" />}
            description={<Translation id="TR_BUY_DETAIL_FAILED_TEXT" />}
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_BUY_DETAIL_FAILED_BUTTON" />
                </Button>
            }
        >
            <TradingDetailTerminalDetails provider={provider} trade={trade} />
        </TradingDetailTerminalState>
    );
};
