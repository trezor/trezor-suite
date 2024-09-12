import styled from 'styled-components';
import { variables, H3, Image } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    padding: 54px 42px;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 54px 20px;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Title = styled(H3)`
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    margin-bottom: 30px;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        text-align: center;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    display: flex;
    margin-bottom: 24px;
`;

export const EmptyWallet = () => (
    <Wrapper data-testid="@dashboard/wallet-ready">
        <StyledImage image="UNI_SUCCESS" />
        <Content>
            <Title>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </Title>
        </Content>
    </Wrapper>
);
