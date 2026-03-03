import { ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';

import { Account } from 'src/types/wallet';

import { TradingDetailProviderInfo } from '../TradingDetailProviderInfo';

type TradingDetailExchangePaymentKYCProps = {
    trade: ExchangeTrade;
    account?: Account;
    provider?: ExchangeProviderInfo;
    supportUrl?: string;
};

export const TradingDetailExchangePaymentKYC = ({
    trade,
    account,
    provider,
    supportUrl,
}: TradingDetailExchangePaymentKYCProps) => (
    <Column gap={24} padding={{ top: 12, bottom: 4 }}>
        <IconCircle name="warning" intent="warning" size={96} />
        <Column>
            <H3 data-testid="@trading/transaction/detail/status">
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />
            </H3>
            <Paragraph
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                textWrap="pretty"
            >
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />
            </Paragraph>
        </Column>
        {supportUrl && (
            <Button intent="neutral" priority="secondary" href={supportUrl} target="_blank">
                <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
            </Button>
        )}
        <Card>
            {provider && (
                <TradingDetailProviderInfo
                    account={account}
                    orderId={trade.orderId}
                    provider={provider}
                    trade={trade}
                    txId={trade.receiveTxHash}
                />
            )}
        </Card>
    </Column>
);
