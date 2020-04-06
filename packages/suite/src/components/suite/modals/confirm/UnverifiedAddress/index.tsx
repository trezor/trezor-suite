import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Translation, Image } from '@suite-components';
import { Button, P, H2 } from '@trezor/components';
import { TrezorDevice, AppState, Dispatch, ExtendedMessageDescriptor } from '@suite-types';

const Wrapper = styled.div`
    max-width: 600px;
    padding: 40px;
`;

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const Actions = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    showAddress: bindActionCreators(receiveActions.showAddress, dispatch),
    showUnverifiedAddress: bindActionCreators(receiveActions.showUnverifiedAddress, dispatch),
    // eslint-disable-next-line @typescript-eslint/camelcase
    applySettings: () => dispatch(deviceSettingsActions.applySettings({ use_passphrase: true })),
});

type Props = {
    device: TrezorDevice;
    address: string;
    addressPath: string;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const ConfirmUnverifiedAddress = ({
    locks,
    device,
    address,
    addressPath,
    showAddress,
    showUnverifiedAddress,
    applySettings,
    onCancel,
}: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    const verifyAddress = async () => {
        if (!device.available) {
            const result = await applySettings();
            if (!result || !result.success) return;
        }
        onCancel();
        showAddress(addressPath, address);
    };

    const unverifiedAddress = () => {
        onCancel();
        showUnverifiedAddress(addressPath, address);
    };

    let deviceStatus: ExtendedMessageDescriptor['id'];
    let claim: ExtendedMessageDescriptor['id'];
    let actionLabel: ExtendedMessageDescriptor['id'];

    if (!device.connected) {
        deviceStatus = 'TR_DEVICE_LABEL_IS_NOT_CONNECTED';
        claim = 'TR_PLEASE_CONNECT_YOUR_DEVICE';
        actionLabel = 'TR_TRY_AGAIN';
    } else {
        // case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
        deviceStatus = 'TR_DEVICE_LABEL_IS_UNAVAILABLE';
        claim = 'TR_PLEASE_ENABLE_PASSPHRASE';
        actionLabel = 'TR_ACCOUNT_ENABLE_PASSPHRASE';
    }

    return (
        <Wrapper>
            <H2>
                <Translation id={deviceStatus} values={{ deviceLabel: device.label }} />
            </H2>
            <P size="small">
                <Translation
                    id="TR_TO_PREVENT_PHISHING_ATTACKS_COMMA"
                    values={{ claim: <Translation id={claim} /> }}
                />
            </P>
            <ImageWrapper>
                <Image image="UNI_ERROR" />
            </ImageWrapper>
            <Actions>
                <Button
                    variant="secondary"
                    onClick={() => unverifiedAddress()}
                    isLoading={progress}
                >
                    <Translation id="TR_SHOW_UNVERIFIED_ADDRESS" />
                </Button>
                <Button variant="primary" onClick={() => verifyAddress()} isLoading={progress}>
                    <Translation id={actionLabel} />
                </Button>
            </Actions>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmUnverifiedAddress);
