import React from 'react';
import { withCoinmarket, WithSelectedAccountLoadedProps } from '@wallet-components';
import { useCoinmarketSavingsSetupWaiting } from '@wallet-hooks/useCoinmarketSavingsSetupWaiting';
import { Button, Loader } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: stretch;
`;

const Message = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledLoader = styled(Loader)`
    margin: 32px 0;
`;

const CoinmarketSavingsSetupWaiting = (props: WithSelectedAccountLoadedProps) => {
    const { handleGoToInvity } = useCoinmarketSavingsSetupWaiting(props);
    return (
        <Wrapper>
            <Message>
                <Translation id="TR_SAVINGS_SETUP_WAITING_MESSAGE" />
            </Message>

            <StyledLoader size={50} />

            <Button onClick={handleGoToInvity}>
                <Translation id="TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL" />
            </Button>
        </Wrapper>
    );
};

export default withCoinmarket(CoinmarketSavingsSetupWaiting, {
    title: 'TR_NAV_INVITY',
});
