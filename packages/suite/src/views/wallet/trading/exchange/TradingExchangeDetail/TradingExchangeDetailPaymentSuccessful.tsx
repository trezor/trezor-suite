import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

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
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <TradingDetailTerminalState
            icon={CheckIcon}
            title={<Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TITLE" />}
            description={<Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TEXT" />}
            action={
                <Button onClick={handleClick}>
                    <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_BUTTON" />
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
