import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';
import { getTradingProviderName } from 'src/views/wallet/trading/common/TradingDetail/utils';

type TradingExchangeDetailPaymentReturnedProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccountKey?: AccountKey;
    provider?: ExchangeProviderInfo;
};

export const TradingExchangeDetailPaymentReturned = ({
    trade,
    account,
    receiveAccountKey,
    provider,
}: TradingExchangeDetailPaymentReturnedProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <TradingDetailTerminalState
            title={<Translation id="TR_EXCHANGE_DETAIL_RETURNED_TITLE" />}
            description={
                <Translation
                    id="TR_EXCHANGE_DETAIL_RETURNED_TEXT"
                    values={{ providerName: getTradingProviderName(provider) }}
                />
            }
            action={
                <Button onClick={handleClick} size="large">
                    <Translation id="TR_EXCHANGE_DETAIL_RETURNED_BUTTON" />
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
