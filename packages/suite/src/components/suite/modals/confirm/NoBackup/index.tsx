import { Translation } from '@suite-components/Translation';

import { Button, H2, P, Icon, colors } from '@trezor/components';
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
            <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />
        </H2>
        <Icon size={32} color={colors.YELLOW} icon="WARNING" />
        <StyledP size="small">
            <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
        </StyledP>
        <Row>
            <BackupButton
                onClick={() => {
                    onReceiveConfirmation(false);
                    onCreateBackup();
                }}
                fullWidth
            >
                <Translation id="TR_CREATE_BACKUP_IN_3_MINUTES" />
            </BackupButton>
            <Button
                variant="secondary"
                onClick={() => onReceiveConfirmation(true)}
                data-test="@no-backup/take-risk-button"
            >
                <Translation id="TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK" />
            </Button>
        </Row>
    </Wrapper>
);

export default ConfirmNoBackup;
