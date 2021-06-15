import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { CRYPTO_INPUT } from '@suite/types/wallet/coinmarketExchangeForm';

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
`;

const Footer = () => {
    const {
        formState,
        watch,
        errors,
        isComposing,
        canCompareOffers,
    } = useCoinmarketExchangeFormContext();
    const hasValues = !!watch(CRYPTO_INPUT) && !!watch('receiveCryptoSelect')?.value;
    const formIsValid = Object.keys(errors).length === 0;

    const isCompareOffersButtonDisabled = !(
        canCompareOffers &&
        formIsValid &&
        hasValues &&
        !formState.isSubmitting
    );

    return (
        <Wrapper>
            <Center>
                <StyledButton
                    isDisabled={isCompareOffersButtonDisabled}
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
