import { useState } from 'react';

import { injectSignVerify } from '@suite-common/sign-verify';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Card } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import {
    SignVerifyContext,
    type SignVerifyOutcome,
    type SignVerifyPage,
} from './SignVerifyContext';
import { SignVerifyForm } from './SignVerifyForm';
import { SignVerifyTab } from './SignVerifyTab';
import { SignVerifyTabs } from './SignVerifyTabs';

type SignVerifyProps = {
    account: Account;
    network?: Network;
};

export const SignVerify = ({ account, network }: SignVerifyProps) => {
    const { signVerify } = useServices(injectSignVerify);

    const [{ page, outcome }, setState] = useState<{
        page: SignVerifyPage;
        outcome: SignVerifyOutcome;
    }>({ page: 'sign', outcome: 'idle' });

    // Clicking the open tab must keep its result, its form is not remounted.
    const changePage = (nextPage: SignVerifyPage) =>
        setState(current =>
            current.page === nextPage ? current : { page: nextPage, outcome: 'idle' },
        );

    // A device call can finish after its tab was left; its result belongs to the unmounted form.
    const setOutcome = (outcomePage: SignVerifyPage, nextOutcome: SignVerifyOutcome) =>
        setState(current =>
            current.page === outcomePage ? { page: outcomePage, outcome: nextOutcome } : current,
        );

    return (
        <Card>
            <SignVerifyContext value={{ page, changePage, outcome, setOutcome }}>
                <SignVerifyTabs>
                    <SignVerifyTab page="sign" />
                    {signVerify.isVerifySupported(account) && <SignVerifyTab page="verify" />}
                </SignVerifyTabs>
                {/* Each tab is a form of its own: keying it throws away what the previous one was in the middle of. */}
                <SignVerifyForm key={page} account={account} network={network} />
            </SignVerifyContext>
        </Card>
    );
};
