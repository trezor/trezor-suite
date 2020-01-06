import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Modal, Button } from '@trezor/components';
import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

// const mapStateToProps = (state: AppState) => ({
//     device: state.suite.device,
//     devices: state.devices,
//     router: state.router,
// });

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeModalApp: bindActionCreators(suiteActions.closeModalApp, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> & { modal: React.ReactNode };
// ReturnType<typeof mapStateToProps>

const FirmwareModal = ({ closeModalApp, modal }: Props) => (
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
            {modal && modal}
            {!modal && (
                <>
                    <div>Example app modal</div>
                    <Button onClick={() => closeModalApp('settings-device')}>Exit</Button>
                </>
            )}
        </div>
    </Modal>
);

export default connect(null, mapDispatchToProps)(FirmwareModal);
