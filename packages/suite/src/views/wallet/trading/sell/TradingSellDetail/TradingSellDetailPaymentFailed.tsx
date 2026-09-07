import { type SellFiatTrade, type SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button, Illustration } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingSellDetailPaymentFailedProps = {
    trade: SellFiatTrade;
    account?: Account;
    provider?: SellProviderInfo;
};

export const TradingSellDetailPaymentFailed = ({
    trade,
    account,
    provider,
}: TradingSellDetailPaymentFailedProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-sell' }));

    return (
        <TradingDetailTerminalState
            artwork={<Illustration name="tradeFailure" intent="critical" width={120} />}
            title={<Translation id="TR_SELL_DETAIL_FAILED_TITLE" />}
            description={<Translation id="TR_SELL_DETAIL_FAILED_TEXT" />}
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_SELL_DETAIL_FAILED_BUTTON" />
                </Button>
            }
        >
            <TradingDetailTerminalDetails
                provider={provider}
                trade={trade}
                account={account}
                txId={trade.txid}
            />
        </TradingDetailTerminalState>
    );
};
