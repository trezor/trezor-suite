import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

export const TradingFormOfferKYCWarning = () => (
    <Banner
        intent="warning"
        icon="identificationCard"
        description={<Translation id="TR_TRADING_KYC_REQUIRED_WARNING" />}
        data-testid="@trading/form/kyc-warning"
    />
);
