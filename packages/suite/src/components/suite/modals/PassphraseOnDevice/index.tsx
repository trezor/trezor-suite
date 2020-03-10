import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { P, variables, colors } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';

import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';

const Wrapper = styled(ModalWrapper)`
    max-width: 360px;
    flex-direction: column;
    text-align: center;
    align-items: center;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 20px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseOnDevice = ({ device, getDiscoveryAuthConfirmationStatus }: Props) => {
    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    if (authConfirmation) {
        return (
            <Wrapper>
                <Title>
                    <Translation
                        {...messages.TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON}
                        values={{ deviceLabel: device.label }}
                    />
                </Title>
                <DeviceConfirmImage device={device} />
                {/* TODO: similar text is in Passphrase modal */}
                <P size="small">
                    <Translation id="TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE" />
                </P>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Title>
                <Translation
                    {...messages.TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL}
                    values={{ deviceLabel: device.label }}
                />
            </Title>
            <DeviceConfirmImage device={device} />
            <P size="small">
                <Translation id="TR_PASSPHRASE_CASE_SENSITIVE" />
            </P>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(PassphraseOnDevice);
