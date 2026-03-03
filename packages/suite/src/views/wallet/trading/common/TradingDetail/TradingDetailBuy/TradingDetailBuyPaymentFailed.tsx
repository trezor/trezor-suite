import { BuyProviderInfo, BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

type TradingDetailBuyPaymentFailedProps = {
    account: Account;
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingDetailBuyPaymentFailed = ({
    account,
    trade,
    provider,
}: TradingDetailBuyPaymentFailedProps) => {
    const dispatch = useDispatch();

    const handleClick = () =>
        dispatch(
            goto('wallet-trading-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle name="x" intent="critical" size={96} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_BUY_DETAIL_ERROR_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_BUY_DETAIL_ERROR_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick} intent="neutral" priority="secondary">
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </Button>
            <Card>
                <Column gap={24}>
                    {provider && (
                        <TradingDetailProviderInfo
                            orderId={trade.paymentId}
                            provider={provider}
                            trade={trade}
                        />
                    )}
                    <TradingDetailSupportBanner provider={provider} orderId={trade.paymentId} />
                </Column>
            </Card>
        </Column>
    );
};
