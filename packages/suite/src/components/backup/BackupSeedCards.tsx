import React from 'react';
import styled from 'styled-components';

import * as backupActions from '@suite/actions/backup/backupActions';
import { Translation } from '@suite-components';
import { variables } from '@trezor/components';
import { useActions, useSelector } from '@suite/hooks/suite';
import BackupSeedCard from './BackupSeedCard';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const StyledBackupSeedCard = styled(BackupSeedCard)`
    width: 30%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
        & + & {
            margin-top: 10px;
        }
    }
`;

const BackupSeedCards = () => {
    const backup = useSelector(s => s.backup);
    const { toggleCheckboxByKey } = useActions({
        toggleCheckboxByKey: backupActions.toggleCheckboxByKey,
    });

    const isChecked = (key: backupActions.ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Wrapper>
            <StyledBackupSeedCard
                // TODO: change data-test, checkbox keys to something more generic, independent of actual content
                data-test="@backup/check-item/wrote-seed-properly"
                onClick={() => toggleCheckboxByKey('wrote-seed-properly')}
                label={<Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />}
                icon="CALENDAR"
                // description={<Translation id="TR_BACKUP_CHECKBOX_1_DESCRIPTION" />}
                isChecked={isChecked('wrote-seed-properly')}
            />
            <StyledBackupSeedCard
                data-test="@backup/check-item/made-no-digital-copy"
                onClick={() => toggleCheckboxByKey('made-no-digital-copy')}
                label={<Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />}
                icon="CALENDAR"
                // description={<Translation id="TR_BACKUP_CHECKBOX_2_DESCRIPTION" />}
                isChecked={isChecked('made-no-digital-copy')}
            />
            <StyledBackupSeedCard
                data-test="@backup/check-item/will-hide-seed"
                onClick={() => toggleCheckboxByKey('will-hide-seed')}
                label={<Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />}
                icon="CALENDAR"
                // description={<Translation id="TR_BACKUP_CHECKBOX_3_DESCRIPTION" />}
                isChecked={isChecked('will-hide-seed')}
            />
        </Wrapper>
    );
};

export default BackupSeedCards;
