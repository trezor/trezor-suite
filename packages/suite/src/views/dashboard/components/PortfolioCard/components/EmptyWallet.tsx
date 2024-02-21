import { HTMLAttributes } from 'react';
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

const Title = styled(H3)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 30px;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        text-align: center;
    }
`;

const StyledImage = styled(props => <Image {...props} />)`
    display: flex;
    margin-bottom: 24px;
`;

const SecurityItem = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};

    & + & {
        margin-top: 12px;
    }
`;

type EmptyWalletProps = HTMLAttributes<HTMLDivElement>;

export const EmptyWallet = (props: EmptyWalletProps) => (
    <Wrapper {...props} data-test-id="@dashboard/wallet-ready">
        <StyledImage image="UNI_SUCCESS" />
        <Content>
            <Title>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </Title>
            <SecurityItem>
                <Translation id="TR_ADDITIONAL_SECURITY_FEATURES" />
            </SecurityItem>
        </Content>
    </Wrapper>
);
