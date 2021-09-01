import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { CRYPTO_INPUT } from '@wallet-types/coinmarketExchangeForm';
import { FooterWrapper } from '@wallet-views/coinmarket';

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
    const hasValues = !!watch(CRYPTO_INPUT) && !!watch('receiveCryptoSelect')?.value;
    const formIsValid = Object.keys(errors).length === 0;

    return (
        <FooterWrapper>
            <Center>
                <StyledButton
                    isDisabled={!(formIsValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting || isComposing}
                    type="submit"
                >
                    <Translation id="TR_EXCHANGE_SHOW_OFFERS" />
                </StyledButton>
            </Center>
        </FooterWrapper>
    );
};

export default Footer;
