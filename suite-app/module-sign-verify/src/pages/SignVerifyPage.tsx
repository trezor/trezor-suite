import { selectFullSelectedAccount } from '@suite/account';
import { injectGetSignVerify } from '@suite-app/networks';
import { useServices } from '@trezor/dependency-injection';
import { useSelector } from '@trezor/suite';

import { SignVerifyPageLayout } from '../components/SignVerifyPageLayout';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    const { getSignVerify } = useServices(injectGetSignVerify);

    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const signVerify = getSignVerify(account);

    // The menu offers Sign & Verify only on networks that have it, so this is reached only by a
    // direct link to the page.
    if (signVerify === null) {
        return null;
    }

    const { Component, title } = signVerify;

    return (
        <SignVerifyPageLayout title={title} selectedAccount={selectedAccount}>
            <Component account={account} />
        </SignVerifyPageLayout>
    );
};
