import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as backupActions from '@suite/actions/backup/backupActions';
import { CheckItem } from '@suite-components';
import { Dispatch, AppState } from '@suite-types';

const CheckboxWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 45px;
    margin-bottom: 2px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    toggleCheckboxByKey: bindActionCreators(backupActions.toggleCheckboxByKey, dispatch),
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
});

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
                title="I have enough time to do a backup (few minutes)"
                description="Once you begin this process you can’t pause it or do it again. Please ensure you have enough time to do this backup."
                isChecked={isChecked('has-enough-time')}
            />
            <CheckItem
                data-test="@backup/check-item/is-in-private"
                onClick={() => toggleCheckboxByKey('is-in-private')}
                title="I am in a safe private or public place away from cameras"
                description="Make sure no one can peek above your shoulder or there are no cameras watching your screen. Nobody should ever see your seed."
                isChecked={isChecked('is-in-private')}
            />
            <CheckItem
                data-test="@backup/check-item/understands-what-seed-is"
                onClick={() => toggleCheckboxByKey('understands-what-seed-is')}
                title="I understand seed is important and I should keep it safe"
                description="Backup seed is the ultimate key to your Wallet and funds. Once you lose it, it’s gone forever and there is no way to restore lost seed."
                isChecked={isChecked('understands-what-seed-is')}
            />
        </CheckboxWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(PreBackupCheckboxes);
