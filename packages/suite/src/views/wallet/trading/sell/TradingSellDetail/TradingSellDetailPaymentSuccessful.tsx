import { type SellFiatTrade, type SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { Button, Illustration } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingSellDetailPaymentSuccessfulProps = {
    trade: SellFiatTrade;
    account?: Account;
    provider?: SellProviderInfo;
};

export const TradingSellDetailPaymentSuccessful = ({
    trade,
    account,
    provider,
}: TradingSellDetailPaymentSuccessfulProps) => {
    const { dispatch } = useServices(selectDispatch);

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-sell' }));

    return (
        <TradingDetailTerminalState
            artwork={<Illustration name="tradeSuccess" width={120} />}
            title={<Translation id="TR_SELL_DETAIL_COMPLETE_TITLE" />}
            description={<Translation id="TR_SELL_DETAIL_COMPLETE_TEXT" />}
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_SELL_DETAIL_COMPLETE_BUTTON" />
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
