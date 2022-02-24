import * as React from 'react';
import styled from 'styled-components';
import { Controller } from 'react-hook-form';
import { Translation } from '@suite-components';
import { Button, Input, Select } from '@trezor/components';
import { InputError, withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useSavingsUserInfo } from '@wallet-hooks/coinmarket/savings/useSavingsUserInfo';
import regional, { PhoneNumberMaxLength } from '@wallet-constants/coinmarket/regional';
import { PhoneNumberRegularExpression } from '@wallet-utils/coinmarket/coinmarketUtils';
import { getInputState } from '@wallet-views/coinmarket';

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 31px;
`;

const NamesWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
    column-gap: 13px;
`;

const PhoneNumberInput = styled(Input)`
    padding-left: 126px;
`;

const UserInfo = (props: WithInvityLayoutProps) => {
    const {
        register,
        errors,
        getValues,
        trigger,
        onSubmit,
        handleSubmit,
        control,
        phoneNumberPrefixCountryOption,
    } = useSavingsUserInfo(props);
    const { familyName, givenName, phoneNumber } = getValues();

    const givenNameInputName = 'givenName';
    const familyNameInputName = 'familyName';
    const phoneNumberPrefixCountryInputName = 'phoneNumberPrefixCountryOption';
    const phoneNumberInputName = 'phoneNumber';
    // TODO: translations
    const isNextStepButtonDisabled = Object.keys(errors).length > 0;
    return (
        <>
            <Header>
                <Translation id="TR_SAVINGS_USERINFO_HEADER" />
            </Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <NamesWrapper>
                    <Input
                        label={<Translation id="TR_SAVINGS_USERINFO_GIVEN_NAME_LABEL" />}
                        name={givenNameInputName}
                        maxLength={255}
                        state={getInputState(errors.givenName, givenName)}
                        innerRef={register({
                            validate: (value: string) => {
                                if (!value) {
                                    return (
                                        <Translation id="TR_SAVINGS_USERINFO_GIVEN_NAME_IS_REQUIRED" />
                                    );
                                }
                            },
                        })}
                        bottomText={<InputError error={errors[givenNameInputName]} />}
                    />
                    <Input
                        label={<Translation id="TR_SAVINGS_USERINFO_FAMILY_NAME_LABEL" />}
                        name={familyNameInputName}
                        maxLength={255}
                        state={getInputState(errors.familyName, familyName)}
                        innerRef={register({
                            validate: (value: string) => {
                                if (!value) {
                                    return (
                                        <Translation id="TR_SAVINGS_USERINFO_FAMILY_NAME_IS_REQUIRED" />
                                    );
                                }
                            },
                        })}
                        bottomText={<InputError error={errors[familyNameInputName]} />}
                    />
                </NamesWrapper>

                <PhoneNumberInput
                    label={<Translation id="TR_SAVINGS_USERINFO_PHONE_NUMBER_LABEL" />}
                    name={phoneNumberInputName}
                    innerRef={register({
                        validate: (value: string) => {
                            if (!PhoneNumberRegularExpression.test(value)) {
                                return (
                                    <Translation id="TR_SAVINGS_USERINFO_PHONE_NUMBER_IS_REQUIRED" />
                                );
                            }

                            const { phoneNumberPrefixCountryOption } = getValues();
                            const phoneNumberPrefix = regional.getPhoneNumberPrefixByCountryCode(
                                phoneNumberPrefixCountryOption.value,
                            );
                            const totalPhoneNumberLength = `${phoneNumberPrefix}${value}`.length;

                            if (totalPhoneNumberLength > PhoneNumberMaxLength) {
                                return (
                                    <Translation
                                        id="TR_SAVINGS_USERINFO_PHONE_NUMBER_MAXLENGTH"
                                        values={{
                                            maxLength: PhoneNumberMaxLength,
                                        }}
                                    />
                                );
                            }
                        },
                    })}
                    bottomText={<InputError error={errors[phoneNumberInputName]} />}
                    addonAlign="left"
                    state={getInputState(errors.phoneNumber, phoneNumber)}
                    innerAddon={
                        <Controller
                            control={control}
                            name={phoneNumberPrefixCountryInputName}
                            defaultValue={phoneNumberPrefixCountryOption}
                            render={({ onChange, value }) => (
                                <Select
                                    options={regional.countriesPhoneNumberPrefixOptions}
                                    isSearchable
                                    value={value}
                                    isClearable={false}
                                    minWidth="86px"
                                    isClean
                                    hideTextCursor
                                    onChange={(value: any) => {
                                        onChange(value);
                                        if (phoneNumber) {
                                            trigger(phoneNumberInputName);
                                        }
                                    }}
                                />
                            )}
                        />
                    }
                />
                <Button isDisabled={isNextStepButtonDisabled}>Next step</Button>
            </form>
        </>
    );
};

export default withInvityLayout(UserInfo, {
    showStepsGuide: true,
});
