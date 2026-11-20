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
    const [page, setPage] = useState<SignVerifyPage>('sign');
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const changePage = (nextPage: SignVerifyPage) => {
        setPage(nextPage);
        setOutcome('idle');
    };

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
