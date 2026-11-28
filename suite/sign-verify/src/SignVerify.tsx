import { type ReactNode, useState } from 'react';

import { Card } from '@trezor/components';

import { SignVerifyAddressInput } from './SignVerifyAddressInput';
import { SignVerifyAddressSelect } from './SignVerifyAddressSelect';
import {
    SignVerifyContext,
    type SignVerifyOutcome,
    type SignVerifyPage,
} from './SignVerifyContext';
import { SignVerifyFormat } from './SignVerifyFormat';
import { SignVerifyMessage } from './SignVerifyMessage';
import { SignVerifyPublicKey } from './SignVerifyPublicKey';
import { SignVerifySignForm } from './SignVerifySignForm';
import { SignVerifySignature } from './SignVerifySignature';
import { SignVerifyTab } from './SignVerifyTab';
import { SignVerifyTabs } from './SignVerifyTabs';
import { SignVerifyVerifyForm } from './SignVerifyVerifyForm';

type SignVerifyProps = {
    children: ReactNode;
};

/**
 * Sign & Verify card composed from its parts, the way `Modal` is: each part reads the state it
 * needs from context, so a network renders only the parts it supports.
 */
const SignVerify = ({ children }: SignVerifyProps) => {
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
                {children}
            </SignVerifyContext>
        </Card>
    );
};

SignVerify.Tabs = SignVerifyTabs;
SignVerify.Tab = SignVerifyTab;
SignVerify.SignForm = SignVerifySignForm;
SignVerify.VerifyForm = SignVerifyVerifyForm;
SignVerify.AddressSelect = SignVerifyAddressSelect;
SignVerify.AddressInput = SignVerifyAddressInput;
SignVerify.Message = SignVerifyMessage;
SignVerify.Signature = SignVerifySignature;
SignVerify.PublicKey = SignVerifyPublicKey;
SignVerify.Format = SignVerifyFormat;

export { SignVerify };
