import React from 'react';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import styled from 'styled-components';
import { ConnectAndUnlockDeviceModal, Translation } from '@suite-components';
import { variables } from '@trezor/components';

import Inputs from './Inputs';
import Footer from './Footer';
import Fees from './Fees';

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

const FeesWrapper = styled.div`
    margin: 25px 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const SellForm = () => {
    const {
        onSubmit,
        handleSubmit,
        isLoading,
        noProviders,
        showConnectAndUnlockDeviceModal,
        setShowConnectAndUnlockDeviceModal,
    } = useCoinmarketSellFormContext();

    return (
        <Wrapper>
            {isLoading && (
                <Loading>
                    <Translation id="TR_SELL_LOADING" />
                </Loading>
            )}
            {!isLoading && noProviders && (
                <NoProviders>
                    <Translation id="TR_SELL_NO_PROVIDERS" />
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
            {showConnectAndUnlockDeviceModal && (
                <ConnectAndUnlockDeviceModal
                    onClose={() => setShowConnectAndUnlockDeviceModal(false)}
                />
            )}
        </Wrapper>
    );
};

export default SellForm;
