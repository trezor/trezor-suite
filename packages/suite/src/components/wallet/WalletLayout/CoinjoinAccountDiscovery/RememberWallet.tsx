import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { Card, Image, Note, Paragraph, Switch } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Container = styled(Card)`
    align-items: center;
    flex-direction: row;
    gap: ${spacingsPx.xxl};
`;

const StyledImage = styled(Image)`
    align-self: flex-start;
`;

const Middle = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
`;

const StyledSwitch = styled(Switch)`
    margin-left: auto;
`;

interface RememberWalletProps {
    isChecked: boolean;
    onChange: () => void;
}

export const RememberWallet = ({ isChecked, onChange }: RememberWalletProps) => (
    <Container>
        <StyledImage image="FOLDER" width={50} />
        <Middle>
            <Paragraph type="titleSmall">
                <Translation id="TR_REMEMBER_WALLET_TITLE" />
            </Paragraph>
            <Note>
                <Translation id="TR_REMEMBER_WALLET_NOTE" />
            </Note>
            <Paragraph>
                <Translation id="TR_REMEMBER_WALLET_DESCRIPTION" />
            </Paragraph>
        </Middle>
        <StyledSwitch isChecked={isChecked} onChange={onChange} />
    </Container>
);
