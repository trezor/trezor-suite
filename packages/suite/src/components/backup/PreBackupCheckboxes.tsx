import React from 'react';
import styled from 'styled-components';
import { CheckItem, Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import * as backupActions from '@suite/actions/backup/backupActions';
import { variables } from '@trezor/components';

const CheckboxWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 2px;
    align-self: center;
    max-width: 80%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        max-width: 100%;
    }
`;

const PreBackupCheckboxes = () => {
    const backup = useSelector(state => state.backup);
    const { toggleCheckboxByKey } = useActions({
        toggleCheckboxByKey: backupActions.toggleCheckboxByKey,
    });
    const isChecked = (key: backupActions.ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <CheckboxWrapper>
            <CheckItem
                data-test="@backup/check-item/has-enough-time"
                onClick={() => toggleCheckboxByKey('has-enough-time')}
                title={<Translation id="TR_I_HAVE_ENOUGH_TIME_TO_DO" />}
                description={<Translation id="TR_ONCE_YOU_BEGIN_THIS_PROCESS" />}
                isChecked={isChecked('has-enough-time')}
            />
            <CheckItem
                data-test="@backup/check-item/is-in-private"
                onClick={() => toggleCheckboxByKey('is-in-private')}
                title={<Translation id="TR_I_AM_IN_SAFE_PRIVATE_OR" />}
                description={<Translation id="TR_MAKE_SURE_NO_ONE_CAN_PEEK" />}
                isChecked={isChecked('is-in-private')}
            />
            <CheckItem
                data-test="@backup/check-item/understands-what-seed-is"
                onClick={() => toggleCheckboxByKey('understands-what-seed-is')}
                title={<Translation id="TR_I_UNDERSTAND_SEED_IS_IMPORTANT" />}
                description={<Translation id="TR_BACKUP_SEED_IS_ULTIMATE" />}
                isChecked={isChecked('understands-what-seed-is')}
            />
        </CheckboxWrapper>
    );
};

export default PreBackupCheckboxes;
