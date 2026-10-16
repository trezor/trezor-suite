import { selectCoinjoinSpendingRestrictionByAccountKey } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type SpendingRestrictionsBannerProps = {
    account?: Account;
};

export const SpendingRestrictionsBanner = ({ account }: SpendingRestrictionsBannerProps) => {
    const restriction = useSelector(state =>
        selectCoinjoinSpendingRestrictionByAccountKey(state, account?.key ?? null),
    );

    // An account without trustworthy scores is handled by the send form, which explains there what
    // failed; this banner is for the accounts that do keep some coins apart on purpose.
    if (restriction !== 'restricted') {
        return null;
    }

    return (
        <Banner
            intent="info"
            icon
            title={<Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_BANNER_TITLE" />}
            description={<Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_BANNER_DESCRIPTION" />}
            data-testid="@wallet/privacy-account/restrictions-banner"
        />
    );
};
