import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';

import Inputs from './Inputs';
import Fees from './Fees';
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

const FeesWrapper = styled.div`
    margin: 25px 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Loading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const CoinmarketExchangeForm = () => {
    const { onSubmit, handleSubmit, isLoading, noProviders } = useCoinmarketExchangeFormContext();

    return (
        <Wrapper>
            {isLoading && (
                <Loading>
                    <Translation id="TR_EXCHANGE_LOADING" />
                </Loading>
            )}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_EXCHANGE_NO_PROVIDERS" />
                </NoProviders>
            )}
            {!isLoading && !noProviders && (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <FeesWrapper>
                        <Fees />
                    </FeesWrapper>
                    <Footer />
                </Form>
            )}
        </Wrapper>
    );
};

export default CoinmarketExchangeForm;
