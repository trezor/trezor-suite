import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Banner, Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

// Sending from a privacy account whose coins could not be scored is blocked: Suite cannot tell a
// coin that went through a coinjoin round from one that did not, and combining them is exactly what
// the restriction prevents. The way out is the coin restrictions switch in account details, which
// this error names; receiving and rescanning are unaffected.
export const SpendingBlocked = () => {
    const { dispatch } = useServices(injectDispatch);

    const goToAccountDetails = () =>
        dispatch(gotoThunk({ routeName: 'wallet-details', preserveParams: true }));

    return (
        <Banner
            intent="warning"
            icon
            title={<Translation id="TR_PRIVACY_ACCOUNT_SPENDING_BLOCKED_TITLE" />}
            description={<Translation id="TR_PRIVACY_ACCOUNT_SPENDING_BLOCKED_DESCRIPTION" />}
            data-testid="@wallet/send/spending-blocked"
            rightContent={
                <Button onClick={goToAccountDetails} size="small">
                    <Translation id="TR_PRIVACY_ACCOUNT_SPENDING_BLOCKED_BUTTON" />
                </Button>
            }
        />
    );
};
