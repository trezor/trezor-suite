import React from 'react';
import { useSelector } from '@suite-hooks';
import { Button, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Footer = () => {
    const { formState, watch } = useFormContext();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const hasValues =
        !!watch('cryptoInput') &&
        !!watch('sellCryptoSelect')?.value &&
        !!watch('buyCryptoSelect')?.value;

    return (
        <Wrapper>
            <Center>
                <StyledButton
                    isDisabled={!(formState.isValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting}
                    type="submit"
                >
                    <Translation id="TR_BUY_SHOW_OFFERS" />
                </StyledButton>
            </Center>
        </Wrapper>
    );
};

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

export default Footer;
