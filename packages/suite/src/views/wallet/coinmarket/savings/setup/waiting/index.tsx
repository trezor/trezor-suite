import { withCoinmarket, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { useCoinmarketSavingsSetupWaiting } from 'src/hooks/wallet/useCoinmarketSavingsSetupWaiting';
import { Button, Spinner } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: stretch;
`;

const Message = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledLoader = styled(Spinner)`
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
