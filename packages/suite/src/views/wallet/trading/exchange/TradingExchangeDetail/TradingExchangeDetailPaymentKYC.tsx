import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { type Account } from 'src/types/wallet';
import { TradingDetailTerminalDetails } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalDetails';
import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

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
        icon={WarningIcon}
        intent="warning"
        title={<Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />}
        description={<Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />}
        action={
            provider?.supportUrl && (
                <Button
                    intent="neutral"
                    priority="secondary"
                    href={provider.supportUrl}
                    target="_blank"
                >
                    <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
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
