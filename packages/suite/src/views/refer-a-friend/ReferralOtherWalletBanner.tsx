import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

export const ReferralOtherWalletBanner = () => (
    <Banner
        intent="info"
        icon
        title={<Translation id="TR_REFERRAL_OTHER_WALLET_TITLE" />}
        description={<Translation id="TR_REFERRAL_OTHER_WALLET_DESCRIPTION" />}
        data-testid="@referral/other-wallet-banner"
    />
);
