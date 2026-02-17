import { SellFiatTrade, SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

type TradingDetailSellPaymentFailedProps = {
    account: Account;
    trade: SellFiatTrade;
    provider?: SellProviderInfo;
};

export const TradingDetailSellPaymentFailed = ({
    account,
    trade,
    provider,
}: TradingDetailSellPaymentFailedProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-trading-sell'));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle name="x" variant="destructive" size={100} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_SELL_DETAIL_ERROR_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_SELL_DETAIL_ERROR_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick} intent="neutral" priority="secondary">
                <Translation id="TR_SELL_DETAIL_ERROR_BUTTON" />
            </Button>
            <Card>
                <Column gap={24}>
                    {provider && (
                        <TradingDetailProviderInfo
                            account={account}
                            orderId={trade.orderId}
                            provider={provider}
                            trade={trade}
                            txId={trade.txid}
                        />
                    )}
                    <TradingDetailSupportBanner provider={provider} orderId={trade.orderId} />
                </Column>
            </Card>
        </Column>
    );
};
