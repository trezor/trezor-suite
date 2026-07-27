import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, IconCircle, Paragraph } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { type Account } from 'src/types/wallet';
import { TradingDetailProviderInfo } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderInfo';

type TradingExchangeDetailPaymentKYCProps = {
    trade: ExchangeTrade;
    account?: Account;
    provider?: ExchangeProviderInfo;
    supportUrl?: string;
};

export const TradingExchangeDetailPaymentKYC = ({
    trade,
    account,
    provider,
    supportUrl,
}: TradingExchangeDetailPaymentKYCProps) => (
    <Column gap={24} padding={{ top: 12, bottom: 4 }}>
        <IconCircle icon={WarningIcon} intent="warning" size={96} />
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
