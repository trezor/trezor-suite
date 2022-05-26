import React from 'react';
import { withCoinmarket, WithSelectedAccountLoadedProps } from '@wallet-components';
import { useCoinmarketSavingsSetupWaiting } from '@wallet-hooks/useCoinmarketSavingsSetupWaiting';
import { Button, Loader } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: stretch;
`;

const Message = styled.div`
    margin-top: 16px;
`;

const GoToInvityButton = styled(Button)`
    margin-top: 16px;
`;

const CoinmarketSavingsSetupWaiting = (props: WithSelectedAccountLoadedProps) => {
    const { handleGoToInvity } = useCoinmarketSavingsSetupWaiting(props);
    return (
        <Wrapper>
            <Loader />
            <Message>
                <Translation id="TR_SAVINGS_SETUP_WAITING_MESSAGE" />
            </Message>
            <GoToInvityButton onClick={handleGoToInvity}>
                <Translation id="TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL" />
            </GoToInvityButton>
        </Wrapper>
    );
};

export default withCoinmarket(CoinmarketSavingsSetupWaiting, {
    title: 'TR_NAV_INVITY',
});
