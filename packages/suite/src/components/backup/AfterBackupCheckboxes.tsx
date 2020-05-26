import { CheckItem } from '@suite-components';
import { AppState, Dispatch } from '@suite-types';
import * as backupActions from '@suite/actions/backup/backupActions';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

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
                title="I wrote down the seed properly"
                description="All words must be in the exact order. Make sure the seed won’t get wet or can’t get smudged to make it not readable."
                isChecked={isChecked('wrote-seed-properly')}
            />
            <CheckItem
                data-test="@backup/check-item/made-no-digital-copy"
                onClick={() => toggleCheckboxByKey('made-no-digital-copy')}
                title="I will never make a digital copy or photo"
                description="Don’t save your seed in a phone or take a picture with any device.
                A cloud or photo service can be hacked and your seed stolen."
                isChecked={isChecked('made-no-digital-copy')}
            />
            <CheckItem
                data-test="@backup/check-item/will-hide-seed"
                onClick={() => toggleCheckboxByKey('will-hide-seed')}
                title="I will hide the seed properly"
                description="Hide your seed properly and/or use further accessories to ensure maximum security of your seed."
                isChecked={isChecked('will-hide-seed')}
            />
        </CheckboxWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AfterBackupCheckboxes);
