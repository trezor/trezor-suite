import React from 'react';
import styled from 'styled-components';
import { Button, variables, Link } from '@trezor/components';
import {
    SavingsPhoneNumberVerificationContext,
    useSavingsPhoneNumberVerification,
} from '@wallet-hooks/coinmarket/savings/useSavingsPhoneNumberVerification';
import { InputError, withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { Translation } from '@suite-components';
import VerificationCodeDigitInput from './components/VerificationCodeDigitInput';

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 14px;
`;

const Description = styled.span`
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 38px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: inline-block;
`;

const PhoneNumber = styled(Description)`
    color: initial;
`;

const VerificationCodeDigitInputsWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
`;

const StyledVerificationCodeDigitInput = styled(VerificationCodeDigitInput)`
    font-size: 24px;
    line-height: 24px;
    text-align: center;
`;

const InputErrorWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    padding: 10px 10px 0 10px;
    min-height: 27px;
    color: ${props => props.theme.TYPE_RED};
    margin-bottom: 44px;
`;

const ChangePhoneNumberLink = styled(Link)`
    margin-left: 6px;
`;

const PhoneNumberVerification = (props: WithInvityLayoutProps) => {
    const contextValues = useSavingsPhoneNumberVerification(props);
    const { error, onSubmit, handleSubmit, formState, phoneNumber, handlePhoneNumberChange } =
        contextValues;
    const { isSubmitting } = formState;

    return (
        <SavingsPhoneNumberVerificationContext.Provider value={contextValues}>
            <Header>
                <Translation id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_HEADER" />
            </Header>
            <Description>
                <Translation
                    id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_DESCRIPTION"
                    values={{
                        phoneNumber: <PhoneNumber>{phoneNumber}</PhoneNumber>,
                    }}
                />
                <ChangePhoneNumberLink onClick={handlePhoneNumberChange}>
                    <Translation id="TR_CHANGE" />
                </ChangePhoneNumberLink>
            </Description>
            <form onSubmit={handleSubmit(onSubmit)}>
                <VerificationCodeDigitInputsWrapper>
                    <StyledVerificationCodeDigitInput index={0} />
                    <StyledVerificationCodeDigitInput index={1} />
                    <StyledVerificationCodeDigitInput index={2} />
                    <StyledVerificationCodeDigitInput index={3} />
                    <StyledVerificationCodeDigitInput index={4} />
                    <StyledVerificationCodeDigitInput index={5} />
                </VerificationCodeDigitInputsWrapper>
                <InputErrorWrapper>
                    <InputError error={error} />
                </InputErrorWrapper>
                <Button isDisabled={isSubmitting} isLoading={isSubmitting}>
                    <Translation id="TR_CONFIRM" />
                </Button>
            </form>
        </SavingsPhoneNumberVerificationContext.Provider>
    );
};

export default withInvityLayout(PhoneNumberVerification, {
    showStepsGuide: true,
});
