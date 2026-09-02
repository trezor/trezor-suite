import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { type Account } from 'src/types/wallet';
import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';
import { TradingDetailSupportBanner } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSupportBanner';

type TradingExchangeDetailPaymentFailedProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccountKey?: AccountKey;
    provider?: ExchangeProviderInfo;
};

export const TradingExchangeDetailPaymentFailed = ({
    trade,
    provider,
    account,
    receiveAccountKey,
}: TradingExchangeDetailPaymentFailedProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

    return (
        <Column gap={24} padding={{ top: 12, bottom: 4 }}>
            <IconCircle icon={XIcon} intent="critical" size={96} />
            <Column>
                <H3 data-testid="@trading/transaction/detail/status">
                    <Translation id="TR_EXCHANGE_DETAIL_ERROR_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_EXCHANGE_DETAIL_ERROR_TEXT" />
                </Paragraph>
            </Column>
            <Button onClick={handleClick} intent="neutral" priority="secondary">
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
            </Button>
            <Card>
                <Column gap={24}>
                    {provider && (
                        <TradingDetailProviderInfo
                            account={account}
                            receiveAccountKey={receiveAccountKey}
                            orderId={trade.orderId}
                            provider={provider}
                            trade={trade}
                            txId={trade.receiveTxHash}
                        />
                    )}
                    <TradingDetailSupportBanner provider={provider} trade={trade} />
                </Column>
            </Card>
        </Column>
    );
};
