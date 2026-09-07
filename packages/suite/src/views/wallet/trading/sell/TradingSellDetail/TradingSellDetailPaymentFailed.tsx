import { type SellFiatTrade, type SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button } from '@trezor/components';
import { XIcon } from '@trezor/icons';

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
            icon={XIcon}
            intent="critical"
            title={<Translation id="TR_SELL_DETAIL_ERROR_TITLE" />}
            description={<Translation id="TR_SELL_DETAIL_ERROR_TEXT" />}
            action={
                <Button onClick={handleClick} intent="neutral" priority="secondary">
                    <Translation id="TR_SELL_DETAIL_ERROR_BUTTON" />
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
