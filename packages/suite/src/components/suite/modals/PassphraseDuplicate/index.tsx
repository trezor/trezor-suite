import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Button, Modal } from '@trezor/components';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Translation } from '@suite-components';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    switchDuplicatedDevice: bindActionCreators(suiteActions.switchDuplicatedDevice, dispatch),
    authorizeDevice: bindActionCreators(suiteActions.authorizeDevice, dispatch),
});

type Props = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Actions = styled.div`
    width: 100%;
    button + button {
        margin-top: 8px;
    }
`;

const PassphraseDuplicate = ({
    locks,
    device,
    duplicate,
    switchDuplicatedDevice,
    authorizeDevice,
}: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Modal
            size="tiny"
            heading={<Translation id="TR_WALLET_DUPLICATE_TITLE" />}
            description={<Translation id="TR_WALLET_DUPLICATE_DESC" />}
            bottomBar={
                <Actions>
                    <Button
                        variant="primary"
                        onClick={() => switchDuplicatedDevice(device, duplicate)}
                        isLoading={progress}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={authorizeDevice}
                        isLoading={progress}
                        fullWidth
                    >
                        <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                    </Button>
                </Actions>
            }
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(PassphraseDuplicate);
