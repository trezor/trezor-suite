import styled from 'styled-components';

import { Card, Image, Note, Switch, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Container = styled(Card)`
    align-items: center;
    display: flex;
    gap: 32px;
`;

const StyledImage = styled(Image)`
    align-self: flex-start;
`;

const Middle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Title = styled.p`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface RememberWalletProps {
    isChecked: boolean;
    onChange: () => void;
}

export const RememberWallet = ({ isChecked, onChange }: RememberWalletProps) => (
    <Container>
        <StyledImage image="FOLDER" width={50} />
        <Middle>
            <Title>
                <Translation id="TR_REMEMBER_WALLET_TITLE" />
            </Title>
            <Note>
                <Translation id="TR_REMEMBER_WALLET_NOTE" />
            </Note>
            <Description>
                <Translation id="TR_REMEMBER_WALLET_DESCRIPTION" />
            </Description>
        </Middle>

        <Switch isChecked={isChecked} onChange={onChange} />
    </Container>
);
