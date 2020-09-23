import React from 'react';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { variables } from '@trezor/components';

import Inputs from './Inputs';
import Footer from './Footer';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0;
    }
`;

const Form = styled.form``;

const Loading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const BuyForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketBuyFormContext();

    return (
        <Wrapper>
            {isLoading && (
                <Loading>
                    <Translation id="TR_BUY_LOADING" />
                </Loading>
            )}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_BUY_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <Footer />
                </Form>
            )}
        </Wrapper>
    );
};

export default BuyForm;
