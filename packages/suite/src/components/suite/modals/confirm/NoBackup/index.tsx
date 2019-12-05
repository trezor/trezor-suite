import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { colors, Icon } from '@trezor/components';
import { Button, H2, P } from '@trezor/components-v2';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 48px;
`;

const BackupButton = styled(Button)`
    margin-bottom: 10px;
`;

const StyledP = styled(P)`
    /* boost-specificity hack to override P base styling */
    && {
        padding-bottom: 20px;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    onReceiveConfirmation: (confirmed: boolean) => void;
    onCreateBackup: () => void;
}

const ConfirmNoBackup = ({ onReceiveConfirmation, onCreateBackup }: Props) => (
    <Wrapper>
        <H2>
            <Translation>{messages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP}</Translation>
        </H2>
        <Icon size={32} color={colors.WARNING_PRIMARY} icon="WARNING" />
        <StyledP size="small">
            <Translation>{messages.TR_IF_YOUR_DEVICE_IS_EVER_LOST}</Translation>
        </StyledP>
        <Row>
            <BackupButton
                onClick={() => {
                    onReceiveConfirmation(false);
                    onCreateBackup();
                }}
            >
                <Translation>{messages.TR_CREATE_BACKUP_IN_3_MINUTES}</Translation>
            </BackupButton>
            <Button variant="secondary" inlineWidth onClick={() => onReceiveConfirmation(true)}>
                <Translation>{messages.TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK}</Translation>
            </Button>
        </Row>
    </Wrapper>
);

export default ConfirmNoBackup;
