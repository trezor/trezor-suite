import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button } from '@trezor/components';
import { XIcon } from '@trezor/icons';

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
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));

    return (
        <TradingDetailTerminalState
            icon={XIcon}
            intent="critical"
            title={<Translation id="TR_BUY_DETAIL_ERROR_TITLE" />}
            description={<Translation id="TR_BUY_DETAIL_ERROR_TEXT" />}
            action={
                <Button onClick={handleClick} intent="neutral" priority="secondary">
                    <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
                </Button>
            }
        >
            <TradingDetailTerminalDetails provider={provider} trade={trade} />
        </TradingDetailTerminalState>
    );
};
