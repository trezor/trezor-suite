import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { CRYPTO_INPUT } from 'src/types/wallet/coinmarketExchangeForm';
import { FooterWrapper } from 'src/views/wallet/coinmarket';

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
    const { formState, getValues, watch, isComposing } = useCoinmarketExchangeFormContext();
    const hasValues = !!watch(CRYPTO_INPUT) && !!watch('receiveCryptoSelect')?.value;
    const formValues = getValues();
    const equalCrypto =
        formValues.sendCryptoSelect.value.toUpperCase() ===
        formValues.receiveCryptoSelect?.value?.toUpperCase();
    const formIsValid = Object.keys(formState.errors).length === 0;

    return (
        <FooterWrapper>
            <Center>
                <StyledButton
                    isDisabled={
                        !(formIsValid && hasValues) || formState.isSubmitting || equalCrypto
                    }
                    isLoading={formState.isSubmitting || isComposing}
                    type="submit"
                    data-test-id="@coinmarket/exchange/compare-button"
                >
                    <Translation id="TR_EXCHANGE_SHOW_OFFERS" />
                </StyledButton>
            </Center>
        </FooterWrapper>
    );
};

export default Footer;
