import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, IconCircle } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';
import { getTradingProviderName } from 'src/views/wallet/trading/common/TradingDetail/utils';

type TradingExchangeDetailPaymentKYCProps = {
    trade: ExchangeTrade;
    account?: Account;
    receiveAccountKey?: AccountKey;
    provider?: ExchangeProviderInfo;
};

export const TradingExchangeDetailPaymentKYC = ({
    trade,
    account,
    receiveAccountKey,
    provider,
}: TradingExchangeDetailPaymentKYCProps) => (
    <TradingDetailTerminalState
        artwork={<IconCircle icon={WarningIcon} intent="warning" size={96} />}
        title={<Translation id="TR_EXCHANGE_DETAIL_KYC_REQUESTED_TITLE" />}
        description={
            <Translation
                id="TR_EXCHANGE_DETAIL_KYC_REQUESTED_TEXT"
                values={{ providerName: getTradingProviderName(provider) }}
            />
        }
        action={
            provider?.supportUrl && (
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    href={provider.supportUrl}
                    target="_blank"
                >
                    <Translation
                        id="TR_EXCHANGE_DETAIL_KYC_REQUESTED_BUTTON"
                        values={{ providerName: getTradingProviderName(provider) }}
                    />
                </Button>
            )
        }
    >
        <TradingDetailTerminalDetails
            provider={provider}
            trade={trade}
            account={account}
            receiveAccountKey={receiveAccountKey}
            txId={trade.receiveTxHash}
        />
    </TradingDetailTerminalState>
);
