import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Prompt } from '@trezor/components';
import { P } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

const Wrapper = styled.div`
    max-width: 360px;
    padding: 30px 48px;
`;

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseOnDevice = ({ device, getDiscoveryAuthConfirmationStatus }: Props) => {
    const majorVersion = device.features ? device.features.major_version : 2;
    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    if (authConfirmation) {
        return (
            <Wrapper>
                <Prompt model={majorVersion} size={32}>
                    Confirm empty hidden wallet passphrase on "{device.label}" device.
                </Prompt>
                {/* TODO: similar text is in Passphrase modal */}
                <P size="small">
                    This hidden Wallet is empty. To make sure you are in the correct Wallet, select
                    Passphrase source.
                </P>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Prompt model={majorVersion} size={32}>
                Enter passphrase on "{device.label}" device.
            </Prompt>
            <P size="small">
                <Translation {...messages.TR_PASSPHRASE_CASE_SENSITIVE} />
            </P>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(PassphraseOnDevice);
