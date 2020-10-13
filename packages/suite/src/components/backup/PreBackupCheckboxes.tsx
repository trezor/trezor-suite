import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as backupActions from '@suite/actions/backup/backupActions';
import { CheckItem, Translation } from '@suite-components';
import { Dispatch, AppState } from '@suite-types';

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

const PreBackupCheckboxes = ({ toggleCheckboxByKey, backup }: Props) => {
    const isChecked = (key: backupActions.ConfirmKey) => {
        return backup.userConfirmed.includes(key);
    };

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

export default connect(mapStateToProps, mapDispatchToProps)(PreBackupCheckboxes);
