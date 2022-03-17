import React from 'react';
import styled from 'styled-components';
import { Button, variables, Icon, Tooltip } from '@trezor/components';
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

const Description = styled.div`
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 38px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    align-items: baseline;
    & > * + div {
        margin: 0 8px;
    }
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

const StyledIcon = styled(Icon)`
    cursor: pointer;
    & div {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${props => props.theme.BG_GREY};
    }
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
                <Translation id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_DESCRIPTION" />
                <PhoneNumber>{phoneNumber}</PhoneNumber>
                <Tooltip
                    content={
                        <Translation id="TR_SAVINGS_PHONE_NUMBER_VERIFICATION_CHANGE_PHONE_NUMBER_TOOLTIP" />
                    }
                    placement="bottom"
                >
                    <StyledIcon icon="PENCIL" size={13} onClick={handlePhoneNumberChange} />
                </Tooltip>
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
