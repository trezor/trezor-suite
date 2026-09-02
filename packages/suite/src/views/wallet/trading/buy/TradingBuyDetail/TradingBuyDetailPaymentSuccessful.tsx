import { type BuyProviderInfo, type BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';

type TradingBuyDetailPaymentSuccessfulProps = {
    trade: BuyTrade;
    provider?: BuyProviderInfo;
};

export const TradingBuyDetailPaymentSuccessful = ({
    trade,
    provider,
}: TradingBuyDetailPaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto({ routeName: 'wallet-trading-buy' }));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle icon={CheckIcon} size={96} />
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
