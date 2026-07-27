import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { IdentificationCardIcon } from '@trezor/icons';

export const TradingKYCWarning = () => (
    <Banner
        intent="warning"
        icon={IdentificationCardIcon}
        description={<Translation id="TR_TRADING_KYC_REQUIRED_WARNING" />}
        data-testid="@trading/form/kyc-warning"
    />
);
