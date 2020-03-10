import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';
import ModalWrapper from '../../ModalWrapper';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 360px;
`;

const Title = styled.div`
    max-width: 80%;
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 20px;
`;

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseSource = ({ device, getDiscoveryAuthConfirmationStatus }: Props) => {
    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    if (authConfirmation) {
        return (
            <Wrapper>
                <Title>
                    <Translation
                        {...messages.TR_CONFIRM_PASSPHRASE_SOURCE}
                        values={{ deviceLabel: device.label }}
                    />
                </Title>
                <DeviceConfirmImage device={device} />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Title>
                <Translation
                    {...messages.TR_SELECT_PASSPHRASE_SOURCE}
                    values={{ deviceLabel: device.label }}
                />
            </Title>
            <DeviceConfirmImage device={device} />
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(PassphraseSource);
