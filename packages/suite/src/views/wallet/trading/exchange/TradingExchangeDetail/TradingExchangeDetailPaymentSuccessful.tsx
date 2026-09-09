import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Illustration } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingExchangeDetailPaymentSuccessfulProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccountKey?: AccountKey;
    provider?: ExchangeProviderInfo;
};

export const TradingExchangeDetailPaymentSuccessful = ({
    trade,
    account,
    receiveAccountKey,
    provider,
}: TradingExchangeDetailPaymentSuccessfulProps) => {
    const { dispatch } = useServices(selectDispatch);

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <TradingDetailTerminalState
            artwork={<Illustration name="tradeSuccess" width={120} />}
            title={<Translation id="TR_EXCHANGE_DETAIL_COMPLETE_TITLE" />}
            description={<Translation id="TR_EXCHANGE_DETAIL_COMPLETE_TEXT" />}
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_EXCHANGE_DETAIL_COMPLETE_BUTTON" />
                </Button>
            }
        >
            <TradingDetailTerminalDetails
                provider={provider}
                trade={trade}
                account={account}
                receiveAccountKey={receiveAccountKey}
                txId={trade.receiveTxHash}
            />
        </TradingDetailTerminalState>
    );
};
