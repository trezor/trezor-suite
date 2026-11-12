import { selectFullSelectedAccount } from '@suite/account';
import { SignVerify } from '@suite/sign-verify';
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

    // Networks whose form has not moved to their network module yet.
    if (signVerify === null) {
        return (
            <SignVerify
                account={account}
                renderShell={({ title, children }) => (
                    <SignVerifyPageLayout title={title} selectedAccount={selectedAccount}>
                        {children}
                    </SignVerifyPageLayout>
                )}
            />
        );
    }

    const { Component, title } = signVerify;

    return (
        <SignVerifyPageLayout title={title} selectedAccount={selectedAccount}>
            <Component account={account} />
        </SignVerifyPageLayout>
    );
};
