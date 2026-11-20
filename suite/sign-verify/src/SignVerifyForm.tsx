import { type ReactNode, use, useEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Button, Column } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';

type SignVerifyFormProps = {
    form: UseFormReturn<SignVerifyValues>;
    submit: (values: SignVerifyValues, device: TrezorDevice | undefined) => Promise<void>;
    children: ReactNode;
};

export const SignVerifyForm = ({ form, submit, children }: SignVerifyFormProps) => {
    const { page, outcome, setOutcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const { device, isLocked } = useDevice();

    // The module owns the form, so leaving the tab has to reset it explicitly.
    useEffect(() => () => form.reset(), [form]);

    const clear = () => {
        form.reset();
        setOutcome(page, 'idle');
    };

    // A failed verification comes with no Clear button, editing the values is the way out.
    const leaveFailedOutcome = () => {
        if (outcome === 'failed') {
            setOutcome(page, 'idle');
        }
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(values => submit(values, device))}
                onChange={leaveFailedOutcome}
            >
                <Column gap={16} margin={{ bottom: 32 }}>
                    {children}
                </Column>
                {/* Distinct keys: a reused <button> turns into the submit button during the Clear click, and the browser then submits the cleared form. */}
                {isCompleted ? (
                    <Button
                        key="clear"
                        type="button"
                        intent="neutral"
                        priority="secondary"
                        onClick={clear}
                        data-testid="@sign-verify/clear"
                        minWidth={200}
                    >
                        <Translation id="TR_CLEAR" />
                    </Button>
                ) : (
                    <Button
                        key="submit"
                        type="submit"
                        intent="brand"
                        isDisabled={isLocked()}
                        isLoading={form.formState.isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        <Translation id={page === 'sign' ? 'TR_SIGN' : 'TR_VERIFY'} />
                    </Button>
                )}
            </form>
        </FormProvider>
    );
};
