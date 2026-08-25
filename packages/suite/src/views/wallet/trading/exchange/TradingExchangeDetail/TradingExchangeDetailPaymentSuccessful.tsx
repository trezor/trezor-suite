import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { useDispatch } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';

type TradingExchangeDetailPaymentSuccessfulProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccount?: Account;
    provider?: ExchangeProviderInfo;
};

export const TradingExchangeDetailPaymentSuccessful = ({
    trade,
    account,
    receiveAccount,
    provider,
}: TradingExchangeDetailPaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto({ routeName: 'wallet-trading-exchange' }));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle icon={CheckIcon} size={96} />
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
                        receiveAccount={receiveAccount}
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
