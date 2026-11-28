import { type ReactNode, useState } from 'react';

import { VStack } from '@suite-native/atoms';

import { SignVerifyAddressInput } from './SignVerifyAddressInput';
import { SignVerifyAddressSelect } from './SignVerifyAddressSelect';
import {
    SignVerifyContext,
    type SignVerifyOutcome,
    type SignVerifyPage,
} from './SignVerifyContext';
import { SignVerifyFormat } from './SignVerifyFormat';
import { SignVerifyMessage } from './SignVerifyMessage';
import { SignVerifySignForm } from './SignVerifySignForm';
import { SignVerifySignature } from './SignVerifySignature';
import { SignVerifyTabs } from './SignVerifyTabs';
import { SignVerifyVerifyForm } from './SignVerifyVerifyForm';

type SignVerifyProps = {
    children: ReactNode;
};

/**
 * Sign & Verify screen content composed from its parts, the way the desktop `SignVerify` is: each
 * part reads the state it needs from context, so a network renders only the parts it supports.
 */
const SignVerify = ({ children }: SignVerifyProps) => {
    const [{ page, outcome }, setState] = useState<{
        page: SignVerifyPage;
        outcome: SignVerifyOutcome;
    }>({ page: 'sign', outcome: 'idle' });

    // Selecting the open tab must keep its result, its form is not remounted.
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
        <SignVerifyContext value={{ page, changePage, outcome, setOutcome }}>
            <VStack spacing="sp16">{children}</VStack>
        </SignVerifyContext>
    );
};

SignVerify.Tabs = SignVerifyTabs;
SignVerify.SignForm = SignVerifySignForm;
SignVerify.VerifyForm = SignVerifyVerifyForm;
SignVerify.AddressSelect = SignVerifyAddressSelect;
SignVerify.AddressInput = SignVerifyAddressInput;
SignVerify.Message = SignVerifyMessage;
SignVerify.Signature = SignVerifySignature;
SignVerify.Format = SignVerifyFormat;

export { SignVerify };
