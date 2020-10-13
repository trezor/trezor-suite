import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { CheckItem, Translation } from '@suite-components';
import { AppState, Dispatch } from '@suite-types';
import * as backupActions from '@suite/actions/backup/backupActions';

const CheckboxWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 2px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            toggleCheckboxByKey: backupActions.toggleCheckboxByKey,
            backupDevice: backupActions.backupDevice,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AfterBackupCheckboxes = ({ toggleCheckboxByKey, backup }: Props) => {
    const isChecked = (key: backupActions.ConfirmKey) => {
        return backup.userConfirmed.includes(key);
    };

    return (
        <CheckboxWrapper>
            <CheckItem
                data-test="@backup/check-item/wrote-seed-properly"
                onClick={() => toggleCheckboxByKey('wrote-seed-properly')}
                title={<Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_1_DESCRIPTION" />}
                isChecked={isChecked('wrote-seed-properly')}
            />
            <CheckItem
                data-test="@backup/check-item/made-no-digital-copy"
                onClick={() => toggleCheckboxByKey('made-no-digital-copy')}
                title={<Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_2_DESCRIPTION" />}
                isChecked={isChecked('made-no-digital-copy')}
            />
            <CheckItem
                data-test="@backup/check-item/will-hide-seed"
                onClick={() => toggleCheckboxByKey('will-hide-seed')}
                title={<Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_3_DESCRIPTION" />}
                isChecked={isChecked('will-hide-seed')}
            />
        </CheckboxWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AfterBackupCheckboxes);
