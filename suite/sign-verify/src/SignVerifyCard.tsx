import { type FormEventHandler, type MouseEvent, type ReactNode } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Button, Card, Column } from '@trezor/components';

import { SignVerifyTabs } from './SignVerifyTabs';
import { type SignVerifyOutcome, type SignVerifyPage } from './types';

type SignVerifyCardProps = {
    page: SignVerifyPage;
    canVerify: boolean;
    outcome: SignVerifyOutcome;
    onPageChange?: (page: SignVerifyPage) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    isSubmitting: boolean;
    onClear: () => void;
    children: ReactNode;
};

export const SignVerifyCard = ({
    page,
    canVerify,
    outcome,
    onPageChange,
    onSubmit,
    isSubmitting,
    onClear,
    children,
}: SignVerifyCardProps) => {
    const { isLocked } = useDevice();

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onClear();
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Card>
            <SignVerifyTabs
                page={page}
                canVerify={canVerify}
                outcome={outcome}
                onPageChange={onPageChange}
            />
            <form onSubmit={onSubmit}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {children}
                </Column>
                {isCompleted ? (
                    <Button
                        type="button"
                        intent="neutral"
                        priority="secondary"
                        onClick={clearForm}
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
        </Card>
    );
};
