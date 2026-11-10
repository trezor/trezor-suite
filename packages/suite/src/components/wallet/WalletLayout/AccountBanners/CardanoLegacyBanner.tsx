import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

interface CardanoLegacyBannerProps {
    account?: Account;
}

export const CardanoLegacyBanner = ({ account }: CardanoLegacyBannerProps) => {
    const isVisible = account?.networkType === 'cardano' && account.accountType === 'legacy';

    if (!isVisible) {
        return null;
    }

    return (
        <Banner
            intent="critical"
            icon={WarningIcon}
            description={<Translation id="TR_ACCOUNT_TYPE_CARDANO_LEGACY_BANNER" />}
        />
    );
};
