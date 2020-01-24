import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Button, Checkbox, H1 } from '@trezor/components-v2';

import * as firmwareActions from '@suite/actions/firmware/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';

const Wrapper = styled.div`
    width: 400px;
    height: 500px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 60px;
`;

const StyledButton = styled(Button)`
    margin: 5px;
`;

const Status = styled.div`
    height: 80px;
`;

const mapStateToProps = (state: AppState) => ({
    firmware: state.firmware,
    device: state.suite.device,
    // devices: state.devices,
    // router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeModalApp: bindActionCreators(routerActions.closeModalApp, dispatch),
    firmwareUpdate: bindActionCreators(firmwareActions.firmwareUpdate, dispatch),
    resetReducer: bindActionCreators(firmwareActions.resetReducer, dispatch),
    confirmSeed: bindActionCreators(firmwareActions.confirmSeed, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Firmware = ({
    closeModalApp,
    firmwareUpdate,
    resetReducer,
    confirmSeed,
    firmware,
    device,
}: Props) => (
    <Wrapper>
        <>
            <H1>Where is my design</H1>
            <Status>
                {firmware.error && firmware.error}
                {!firmware.error && firmware.status}
            </Status>

            <Checkbox
                isChecked={firmware.userConfirmedSeed}
                onClick={() => confirmSeed(!firmware.userConfirmedSeed)}
            >
                I have seed and attend service at church regularly
            </Checkbox>

            <StyledButton
                isDisabled={
                    !firmware.userConfirmedSeed ||
                    !device ||
                    (device && device.features && device.mode !== 'bootloader')
                }
                onClick={() => firmwareUpdate()}
                data-test="@modal/firmware/start-button"
            >
                Start
            </StyledButton>
            <StyledButton
                onClick={() => {
                    closeModalApp();
                    resetReducer();
                }}
                data-test="@modal/firmware/exit-button"
                variant="secondary"
            >
                Exit
            </StyledButton>
        </>
    </Wrapper>
);

export default connect(mapStateToProps, mapDispatchToProps)(Firmware);
