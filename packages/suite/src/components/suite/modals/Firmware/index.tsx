import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Modal, Button } from '@trezor/components';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';

// const mapStateToProps = (state: AppState) => ({
//     device: state.suite.device,
//     devices: state.devices,
//     router: state.router,
// });

const mapDispatchToProps = (dispatch: Dispatch) => ({
    exitApp: bindActionCreators(suiteActions.exitApp, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;
// ReturnType<typeof mapStateToProps>

const FirmwareModal = ({ exitApp }: Props) => (
    <Modal>
        <div
            style={{
                width: '400px',
                height: '400px',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '100px',
            }}
        >
            <div>Example app modal</div>
            <Button
                onClick={() =>
                    exitApp('settings-device', [SUITE.LOCK_TYPE.ROUTER, SUITE.LOCK_TYPE.DEVICE])
                }
            >
                Exit
            </Button>
        </div>
    </Modal>
);

export default connect(null, mapDispatchToProps)(FirmwareModal);
