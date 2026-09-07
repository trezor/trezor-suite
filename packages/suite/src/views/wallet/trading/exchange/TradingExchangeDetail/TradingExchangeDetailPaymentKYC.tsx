import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { TradingDetailTerminalState } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTerminalState';

type TradingExchangeDetailPaymentKYCProps = {
    supportUrl?: string;
};

export const TradingExchangeDetailPaymentKYC = ({
    supportUrl,
}: TradingExchangeDetailPaymentKYCProps) => (
    <TradingDetailTerminalState
        icon={WarningIcon}
        intent="warning"
        title={<Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />}
        description={<Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />}
        action={
            supportUrl && (
                <Button intent="neutral" priority="secondary" href={supportUrl} target="_blank">
                    <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
                </Button>
            )
        }
    />
);
