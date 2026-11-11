import { type ComponentType, type ReactNode, useState } from 'react';

import { useDevice } from '@suite/device';
import { type TranslationKey, isTranslationKey } from '@suite/intl';
import { useMessageSigning } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';

import { SignVerifyForm, type SignVerifyFormProps } from './SignVerifyForm';
import { type SignVerifyPage } from './types';

/**
 * What a network's own sign & verify UI receives. It gets the same `signing` as the default form,
 * so it never reimplements the operations, and the default form itself, so it can wrap or extend
 * it instead of replacing everything.
 */
export type SignVerifyOverrideProps = SignVerifyFormProps & {
    DefaultForm: ComponentType<SignVerifyFormProps>;
};

/** Optional per-family replacements of the default form, chosen by the app that renders it. */
export type SignVerifyOverrides = Readonly<
    Partial<Record<string, ComponentType<SignVerifyOverrideProps>>>
>;

type SignVerifyShellProps = {
    title: TranslationKey;
    isDeviceConnected: boolean | undefined;
    children: ReactNode;
};

type SignVerifyProps = {
    account: Account;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
    overrides?: SignVerifyOverrides;
};

export const SignVerify = ({ account, renderShell, overrides }: SignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');
    const { device } = useDevice();
    const signing = useMessageSigning(account);

    // The page is only reachable for accounts whose network can sign, see the wallet menu.
    if (signing === undefined) {
        return null;
    }

    const formProps: SignVerifyFormProps = { account, signing, page, onPageChange: setPage };
    const Override = overrides?.[signing.family];
    // Each tab of each account is a form of its own: keying it throws away everything the previous
    // one was in the middle of, including the outcome it had reached.
    const formKey = `${page}-${account.key}`;

    return renderShell({
        title: isTranslationKey(signing.title.id) ? signing.title.id : 'TR_NAV_SIGN_VERIFY',
        isDeviceConnected: device?.connected && device?.available,
        children: Override ? (
            <Override key={formKey} {...formProps} DefaultForm={SignVerifyForm} />
        ) : (
            <SignVerifyForm key={formKey} {...formProps} />
        ),
    });
};
