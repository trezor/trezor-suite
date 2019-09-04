import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, P } from '@trezor/components';
import { backupDevice } from '@suite-actions/backupActions';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite-utils/router';
import styled from 'styled-components';
// import { InjectedIntlProps } from 'react-intl';
import { AppState } from '@suite-types';

// note this Wrapper is copypasta from 'firmware' page
const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 30px 24px;
    flex: 1;
`;

interface BackupProps {
    device: AppState['suite']['device'];
    goto: typeof goto;
    backupDevice: typeof backupDevice;
}

const Backup = (props: BackupProps) => {
    const { device } = props;
    if (!device || !device.features) return null;

    const getStatus = () => {
        if (device.features.unfinished_backup) {
            return 'backup-failed';
        }
        if (device.features.needs_backup) {
            return 'needs-backup';
        }
        return 'backup-finished';
    };

    return (
        <Wrapper>
            {getStatus() === 'backup-failed' && (
                <P>
                    Backup procedure failed. For security reasons, device will show its seed only
                    once. You need to wipe device and start over.
                </P>
            )}
            {getStatus() === 'backup-finished' && (
                <>
                    <P>
                        Device is already backed up. You should have your recovery seed. If you dont
                        have it, you should do something about it now.
                    </P>
                    <Button onClick={() => goto(getRoute('wallet-index'))}>Go to wallet</Button>
                </>
            )}
            {getStatus() === 'needs-backup' && (
                <>
                    <P>Create backup. Follow instructions on your device</P>
                    <Button onClick={() => props.backupDevice({ device })}>Start</Button>
                </>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        backupDevice: bindActionCreators(backupDevice, dispatch),
        goto: bindActionCreators(goto, dispatch),
    }),
)(Backup);
