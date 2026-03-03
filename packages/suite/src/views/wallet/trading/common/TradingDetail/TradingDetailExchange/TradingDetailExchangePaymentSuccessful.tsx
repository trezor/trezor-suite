import { ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';

type TradingDetailExchangePaymentSuccessfulProps = {
    trade: ExchangeTrade;
    account?: Account;
    provider?: ExchangeProviderInfo;
};

export const TradingDetailExchangePaymentSuccessful = ({
    trade,
    account,
    provider,
}: TradingDetailExchangePaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-trading-exchange'));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle name="check" size={96} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick}>
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_BUTTON" />
            </Button>
            {provider && (
                <Card>
                    <TradingDetailProviderInfo
                        account={account}
                        orderId={trade.orderId}
                        provider={provider}
                        trade={trade}
                        txId={trade.receiveTxHash}
                    />
                </Card>
            )}
        </Column>
    );
};
