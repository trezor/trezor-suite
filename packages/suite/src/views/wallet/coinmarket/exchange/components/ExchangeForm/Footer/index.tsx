import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    padding-top: 40px;
`;

const Center = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
`;

const StyledButton = styled(Button)`
    min-width: 200px;
    margin-left: 20px;
`;

const Footer = () => {
    const { formState, watch, errors, isComposing } = useCoinmarketExchangeFormContext();
    const hasValues = !!watch('sendCryptoInput') && !!watch('receiveCryptoSelect')?.value;
    const formIsValid = Object.keys(errors).length === 0;

    return (
        <Wrapper>
            <Center>
                <StyledButton
                    isDisabled={!(formIsValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting || isComposing}
                    type="submit"
                >
                    <Translation id="TR_EXCHANGE_SHOW_OFFERS" />
                </StyledButton>
            </Center>
        </Wrapper>
    );
};

export default Footer;
