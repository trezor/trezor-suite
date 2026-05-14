import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import { type Account } from 'src/types/wallet';

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
            icon="warning"
            description={<Translation id="TR_ACCOUNT_TYPE_CARDANO_LEGACY_BANNER" />}
        />
    );
};
