import React from 'react';
import { useBuyFormContext } from '@wallet-hooks/useBuyForm';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { variables } from '@trezor/components';

import Inputs from './Inputs';
import Footer from './Footer';

const BuyForm = () => {
    const { onSubmit, handleSubmit, buyInfo, account } = useBuyFormContext();
    const isLoading = !buyInfo?.buyInfo;
    const noProviders =
        buyInfo?.buyInfo?.providers.length === 0 ||
        !buyInfo?.supportedCryptoCurrencies.has(account.symbol);

    return (
        <Wrapper>
            {isLoading && (
                <Loading>
                    <Translation id="TR_BUY_LOADING" />
                </Loading>
            )}
            {(!isLoading && noProviders) ||
                (!buyInfo && (
                    <NoProviders>
                        <Translation id="TR_BUY_NO_PROVIDERS" />
                    </NoProviders>
                ))}
            {!isLoading && !noProviders && buyInfo && (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Inputs />
                    <Footer />
                </Form>
            )}
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 25px;
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

export default BuyForm;
