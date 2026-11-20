import { type FormEvent, type ReactNode, use, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Button, Column } from '@trezor/components';
import { throwError } from '@trezor/utils';

import {
    SignVerifyContext,
    type SignVerifyErrors,
    SignVerifyFormContext,
    type SignVerifyValues,
} from './SignVerifyContext';

type SignVerifyFormProps = {
    defaultValues: SignVerifyValues;
    getErrors: (values: SignVerifyValues) => SignVerifyErrors;
    submit: (
        values: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => Promise<Partial<SignVerifyValues>>;
    children: ReactNode;
};

export const SignVerifyForm = ({
    defaultValues,
    getErrors,
    submit,
    children,
}: SignVerifyFormProps) => {
    const { page, outcome, setOutcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const [values, setValues] = useState(defaultValues);
    const [errors, setErrors] = useState<SignVerifyErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { device, isLocked } = useDevice();

    const update = (changes: Partial<SignVerifyValues>) => {
        setValues({ ...values, ...changes });
        setErrors({});

        // A failed verification comes with no Clear button, editing the values is the way out.
        if (outcome === 'failed') {
            setOutcome('idle');
        }
    };

    const clear = () => {
        setValues(defaultValues);
        setErrors({});
        setOutcome('idle');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const submitErrors = getErrors(values);
        setErrors(submitErrors);

        const hasErrors = Object.values(submitErrors).some(error => error !== undefined);

        if (hasErrors) {
            return;
        }

        setIsSubmitting(true);
        const changes = await submit(values, device);
        setValues(current => ({ ...current, ...changes }));
        setIsSubmitting(false);
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <SignVerifyFormContext value={{ values, errors, update }}>
            <form onSubmit={handleSubmit}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {children}
                </Column>
                {isCompleted ? (
                    <Button
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
                        type="submit"
                        intent="brand"
                        isDisabled={isLocked()}
                        isLoading={isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        <Translation id={page === 'sign' ? 'TR_SIGN' : 'TR_VERIFY'} />
                    </Button>
                )}
            </form>
        </SignVerifyFormContext>
    );
};
