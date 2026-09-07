import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button, Illustration } from '@trezor/components';

import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingBuyDetailPaymentSuccessfulProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingBuyDetailPaymentSuccessful = ({
    trade,
    provider,
}: TradingBuyDetailPaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));

    return (
        <TradingDetailTerminalState
            artwork={<Illustration name="tradeSuccess" width={120} />}
            title={<Translation id="TR_BUY_DETAIL_COMPLETE_TITLE" />}
            description={<Translation id="TR_BUY_DETAIL_COMPLETE_TEXT" />}
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_BUY_DETAIL_COMPLETE_BUTTON" />
                </Button>
            }
        >
            <TradingDetailTerminalDetails provider={provider} trade={trade} />
        </TradingDetailTerminalState>
    );
};
