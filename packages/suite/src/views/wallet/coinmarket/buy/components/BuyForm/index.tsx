import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { Wrapper, NoProviders } from '@wallet-views/coinmarket';
import { CoinmarketSkeleton } from '@wallet-views/coinmarket/skeleton';

import Inputs from './Inputs';
import Footer from './Footer';

const Form = styled.form`
    width: 100%;
`;

const BuyForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketBuyFormContext();
    return (
        <Wrapper responsiveSize="LG">
            {isLoading && <CoinmarketSkeleton />}
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
