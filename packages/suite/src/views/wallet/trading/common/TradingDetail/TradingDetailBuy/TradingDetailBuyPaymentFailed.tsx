import { BuyProviderInfo, BuyTrade } from 'invity-api';

import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { TradingDetailInfo } from '../TradingDetailInfo';
import { TradingDetailSupportBanner } from '../TradingDetailSupportBanner';

type PaymentFailedProps = {
    account: Account;
    trade: BuyTrade;
    provider?: BuyProviderInfo;
    supportUrl?: string;
};

export const TradingDetailBuyPaymentFailed = ({
    supportUrl,
    account,
    trade,
    provider,
}: PaymentFailedProps) => {
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
            <IconCircle name="x" variant="destructive" size={100} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_BUY_DETAIL_ERROR_TITLE" />
                </H3>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    <Translation id="TR_BUY_DETAIL_ERROR_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick} intent="neutral" priority="secondary">
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </Button>
            <Card>
                <Column gap={24}>
                    {provider && <TradingDetailInfo provider={provider} trade={trade} />}
                    {provider && supportUrl && (
                        <TradingDetailSupportBanner provider={provider} supportUrl={supportUrl} />
                    )}
                </Column>
            </Card>
        </Column>
    );
};
