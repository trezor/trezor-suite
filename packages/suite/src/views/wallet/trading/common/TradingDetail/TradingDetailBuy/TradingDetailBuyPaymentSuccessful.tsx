import { BuyProviderInfo, BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';

type TradingDetailBuyPaymentSuccessfulProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingDetailBuyPaymentPaymentSuccessful = ({
    trade,
    provider,
}: TradingDetailBuyPaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-trading-buy'));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle name="check" size={100} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_BUY_DETAIL_SUCCESS_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_BUY_DETAIL_SUCCESS_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick}>
                <Translation id="TR_BUY_DETAIL_SUCCESS_BUTTON" />
            </Button>
            {provider && (
                <Card>
                    <TradingDetailProviderInfo
                        orderId={trade.paymentId}
                        provider={provider}
                        trade={trade}
                    />
                </Card>
            )}
        </Column>
    );
};
