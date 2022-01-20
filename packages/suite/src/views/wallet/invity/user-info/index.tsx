import { InputError, withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useSavingsUserInfo } from '@wallet-hooks/coinmarket/savings/useSavingsUserInfo';
import { Button, Input } from '@trezor/components';
import * as React from 'react';
import { Translation } from '@suite-components';

const UserInfo = (props: WithInvityLayoutProps) => {
    const { register, errors, onSubmit, handleSubmit } = useSavingsUserInfo(props);
    const givenNameInputName = 'givenName';
    const familyNameInputName = 'familyName';
    const phoneNumberInputName = 'phoneNumber';
    // TODO: translations
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Input
                label="Given name"
                name={givenNameInputName}
                maxLength={255}
                innerRef={register({
                    validate: (value: string) => {
                        if (!value) {
                            return <Translation id="TR_SAVINGS_USERINFO_GIVEN_NAME_IS_REQUIRED" />;
                        }
                    },
                })}
                bottomText={<InputError error={errors[givenNameInputName]} />}
            />
            <Input
                label="Family name"
                name={familyNameInputName}
                maxLength={255}
                innerRef={register({
                    validate: (value: string) => {
                        if (!value) {
                            return <Translation id="TR_SAVINGS_USERINFO_FAMILY_NAME_IS_REQUIRED" />;
                        }
                    },
                })}
                bottomText={<InputError error={errors[familyNameInputName]} />}
            />
            <Input
                label="Phone number"
                name={phoneNumberInputName}
                maxLength={20}
                innerRef={register({
                    validate: (value: string) => {
                        if (!value) {
                            return (
                                <Translation id="TR_SAVINGS_USERINFO_PHONE_NUMBER_IS_REQUIRED" />
                            );
                        }
                    },
                })}
                bottomText={<InputError error={errors[phoneNumberInputName]} />}
            />
            <Button>Next step</Button>
        </form>
    );
};

export default withInvityLayout(UserInfo);
