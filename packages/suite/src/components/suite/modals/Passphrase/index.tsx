import TrezorConnect from 'trezor-connect';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
import { Translation, Modal } from '@suite-components';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import PassphraseTypeCard from './components/PassphraseTypeCard';

const Wrapper = styled.div<{ authConfirmation?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    /* width: ${props => (props.authConfirmation ? 'auto' : '660px')}; */

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const WalletsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const Divider = styled.div`
    margin: 16px 16px;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
`;

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
            onPassphraseSubmit: modalActions.onPassphraseSubmit,
        },
        dispatch,
    );

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Passphrase = (props: Props) => {
    const { device } = props;
    const [submitted, setSubmitted] = useState(false);
    const authConfirmation = props.getDiscoveryAuthConfirmationStatus() || device.authConfirm;
    const stateConfirmation = !!device.state;
    const hasEmptyPassphraseWallet = deviceUtils
        .getDeviceInstances(device, props.devices)
        .find(d => d.useEmptyPassphrase);
    const noPassphraseOffer = !hasEmptyPassphraseWallet && !stateConfirmation;
    const onDeviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    const onSubmit = (value: string, passphraseOnDevice?: boolean) => {
        setSubmitted(true);
        props.onPassphraseSubmit(value, !!passphraseOnDevice);
    };

    const onRecreate = () => {
        // Cancel TrezorConnect request and pass error to suiteAction.authConfirm
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    if (submitted) {
        return null;
    }

    if (authConfirmation || stateConfirmation) {
        // show borderless one-column modal for confirming passphrase and state confirmation
        return (
            <Modal
                heading={
                    !authConfirmation ? (
                        <Translation id="TR_ENTER_PASSPHRASE" />
                    ) : (
                        <Translation id="TR_CONFIRM_EMPTY_HIDDEN_WALLET" />
                    )
                }
                description={
                    !authConfirmation ? (
                        <Translation id="TR_UNLOCK" />
                    ) : (
                        <Translation id="TR_THIS_HIDDEN_WALLET_IS_EMPTY" />
                    )
                }
                size="tiny"
            >
                <PassphraseTypeCard
                    type="hidden"
                    authConfirmation={authConfirmation}
                    recreateWallet={authConfirmation ? onRecreate : undefined}
                    submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    singleColModal
                />
            </Modal>
        );
    }

    // creating a hidden wallet
    if (!noPassphraseOffer) {
        return (
            <Modal
                heading={<Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />}
                description={<Translation id="TR_HIDDEN_WALLET_MODAL_DESCRIPTION" />}
                size="tiny"
            >
                <PassphraseTypeCard
                    title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                    description={<Translation id="TR_HIDDEN_WALLET_DESCRIPTION" />}
                    submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                    type="hidden"
                    singleColModal
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                />
            </Modal>
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <Modal
            cancelable={false}
            heading={<Translation id="TR_SELECT_WALLET_TO_ACCESS" />}
            size="small"
        >
            <Wrapper>
                <WalletsWrapper>
                    <PassphraseTypeCard
                        title={<Translation id="TR_NO_PASSPHRASE_WALLET" />}
                        description={<Translation id="TR_STANDARD_WALLET_DESCRIPTION" />}
                        submitLabel={<Translation id="TR_ACCESS_STANDARD_WALLET" />}
                        type="standard"
                        onSubmit={onSubmit}
                    />
                    <Divider />
                    <PassphraseTypeCard
                        title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                        description={<Translation id="TR_HIDDEN_WALLET_DESCRIPTION" />}
                        submitLabel={<Translation id="TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET" />}
                        type="hidden"
                        offerPassphraseOnDevice={onDeviceOffer}
                        onSubmit={onSubmit}
                    />
                </WalletsWrapper>
            </Wrapper>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
