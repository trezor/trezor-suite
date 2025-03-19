import styled from 'styled-components';

import { Card, Column, Image, Note, Paragraph, Row, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    align-self: flex-start;
`;

const SwitchWrapper = styled.div`
    margin-left: auto;
`;

interface RememberWalletProps {
    isChecked: boolean;
    onChange: () => void;
}

export const RememberWallet = ({ isChecked, onChange }: RememberWalletProps) => (
    <Card>
        <Row gap={spacings.xxl} alignItems="center">
            <StyledImage image="FOLDER" width={50} />
            <Column gap={spacings.xxs}>
                <Paragraph typographyStyle="titleSmall">
                    <Translation id="TR_REMEMBER_WALLET_TITLE" />
                </Paragraph>
                <Note>
                    <Translation id="TR_REMEMBER_WALLET_NOTE" />
                </Note>
                <Paragraph>
                    <Translation id="TR_REMEMBER_WALLET_DESCRIPTION" />
                </Paragraph>
            </Column>
            <SwitchWrapper>
                <Switch isChecked={isChecked} onChange={onChange} />
            </SwitchWrapper>
        </Row>
    </Card>
);
