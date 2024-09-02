import styled from 'styled-components';

import { spacings, spacingsPx } from '@trezor/theme';

import { Card, Image, Note, Paragraph, Row, Switch } from '@trezor/components';
import { Translation } from 'src/components/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    align-self: flex-start;
`;

const Middle = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledSwitch = styled(Switch)`
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
            <Middle>
                <Paragraph typographyStyle="titleSmall">
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
        </Row>
    </Card>
);
