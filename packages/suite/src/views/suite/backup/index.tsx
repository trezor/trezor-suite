import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { P } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import * as backupActions from '@suite-actions/backupActions';
import * as routerActions from '@suite-actions/routerActions';
import styled from 'styled-components';
import { AppState, Dispatch } from '@suite-types';
import { SuiteLayout } from '@suite-components';

// note this Wrapper is copypasta from 'firmware' page
const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 30px 24px;
    flex: 1;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Backup = (props: Props) => {
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
        <SuiteLayout showSuiteHeader>
            <Wrapper>
                {getStatus() === 'backup-failed' && (
                    <P>
                        Backup procedure failed. For security reasons, device will show its seed
                        only once. You need to wipe device and start over.
                    </P>
                )}
                {getStatus() === 'backup-finished' && (
                    <>
                        <P>
                            Device is already backed up. You should have your recovery seed. If you
                            dont have it, you should do something about it now.
                        </P>
                        <Button onClick={() => props.goto('wallet-index')} inlineWidth>Go to wallet</Button>
                    </>
                )}
                {getStatus() === 'needs-backup' && (
                    <>
                        <P>Create backup. Follow instructions on your device</P>
                        <Button onClick={() => props.backupDevice({ device })} inlineWidth>Start</Button>
                    </>
                )}
            </Wrapper>
        </SuiteLayout>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Backup);
