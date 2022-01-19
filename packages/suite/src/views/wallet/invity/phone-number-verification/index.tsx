import * as React from 'react';
import { Button, Input } from '@trezor/components';
import { useSavingsPhoneNumberVerification } from '@wallet-hooks/coinmarket/savings/useSavingsPhoneNumberVerification';
import { InputError, withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { Translation } from '@suite-components';

const PhoneNumberVerification = ({ selectedAccount }: WithInvityLayoutProps) => {
    const { register, errors, onSubmit, handleSubmit } =
        useSavingsPhoneNumberVerification(selectedAccount);
    const codeInputName = 'code';
    // TODO: translations
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Input
                label="Verification code"
                name={codeInputName}
                maxLength={6}
                innerRef={register({
                    validate: (value: string) => {
                        if (!value) {
                            return (
                                <Translation id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CODE_IS_REQUIRED" />
                            );
                        }
                    },
                })}
                bottomText={<InputError error={errors[codeInputName]} />}
            />
            <Button>Next step</Button>
        </form>
    );
};

export default withInvityLayout(PhoneNumberVerification);
