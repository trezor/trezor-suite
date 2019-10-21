import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/IntlMessageExtractor';

import { H5, P, Icon, Button, colors } from '@trezor/components';
import l10nCommonMessages from '../../messages';

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 48px;
`;

const BackupButton = styled(Button)`
    width: 100%;
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
        <H5>
            <Translation>{l10nCommonMessages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP}</Translation>
        </H5>
        <Icon size={32} color={colors.WARNING_PRIMARY} icon="WARNING" />
        <StyledP size="small">
            <Translation>{l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST}</Translation>
        </StyledP>
        <Row>
            <BackupButton
                onClick={() => {
                    onReceiveConfirmation(false);
                    onCreateBackup();
                }}
            >
                <Translation>{l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES}</Translation>
            </BackupButton>
            <Button isInverse variant="warning" onClick={() => onReceiveConfirmation(true)}>
                <Translation>{l10nCommonMessages.TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK}</Translation>
            </Button>
        </Row>
    </Wrapper>
);

export default ConfirmNoBackup;
