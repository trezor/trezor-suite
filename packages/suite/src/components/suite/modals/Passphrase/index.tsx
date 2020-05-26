import TrezorConnect from 'trezor-connect';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Modal, variables, colors } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
import { ExternalLink, Loading, Translation } from '@suite-components';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { PASSPHRASE_URL } from '@suite-constants/urls';
import PassphraseTypeCard from './components/PassphraseTypeCard';

const CARD_SIZE = '310px';

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
    display: grid;
    width: 100%;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(${CARD_SIZE}, 1fr));
    margin-top: 24px;
`;

const GrayModal = styled(Modal)`
    background: ${colors.BLACK96};
    width: 360px;
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
        props.onPassphraseSubmit(value, !!passphraseOnDevice, !!hasEmptyPassphraseWallet);
    };

    const onRecreate = async () => {
        // Cancel TrezorConnect request and pass error to suiteAction.authConfirm
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    if (submitted) {
        return <Loading />;
    }

    if (authConfirmation || stateConfirmation) {
        // show borderless one-column modal for confirming passphrase and state confirmation
        return (
            <GrayModal
                useFixedWidth={false}
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
                    authConfirmation={authConfirmation}
                    recreateWallet={authConfirmation ? onRecreate : undefined}
                    submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                    colorVariant="secondary"
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    singleColModal
                    showPassphraseInput
                />
            </GrayModal>
        );
    }

    // creating a hidden wallet
    if (!noPassphraseOffer) {
        return (
            <GrayModal
                useFixedWidth={false}
                heading={<Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />}
                description={<Translation id="TR_ENTER_EXISTING_PASSPHRASE" />}
                size="tiny"
            >
                <PassphraseTypeCard
                    // title={<Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />}
                    // description={<Translation id="TR_ENTER_EXISTING_PASSPHRASE" />}
                    submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                    colorVariant="secondary"
                    offerPassphraseOnDevice={onDeviceOffer}
                    showPassphraseInput
                    singleColModal
                    onSubmit={onSubmit}
                />
            </GrayModal>
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <Modal
            heading={<Translation id="TR_SELECT_WALLET_TO_ACCESS" />}
            description={
                <>
                    <Translation id="TR_CHOOSE_BETWEEN_NO_PASSPHRASE" />
                    <ExternalLink size="small" href={PASSPHRASE_URL}>
                        <Translation id="TR_WHAT_IS_PASSPHRASE" />
                    </ExternalLink>
                </>
            }
        >
            <Wrapper>
                <WalletsWrapper>
                    <PassphraseTypeCard
                        title={<Translation id="TR_NO_PASSPHRASE_WALLET" />}
                        description={<Translation id="TR_TO_ACCESS_STANDARD_NO_PASSPHRASE" />}
                        submitLabel={<Translation id="TR_ACCESS_STANDARD_WALLET" />}
                        colorVariant="primary"
                        offerPassphraseOnDevice={onDeviceOffer}
                        onSubmit={onSubmit}
                    />
                    <PassphraseTypeCard
                        title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                        description={
                            <Translation id="TR_WALLET_SELECTION_ENTER_EXISTING_PASSPHRASE" />
                        }
                        submitLabel={<Translation id="TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET" />}
                        colorVariant="secondary"
                        offerPassphraseOnDevice={onDeviceOffer}
                        showPassphraseInput
                        onSubmit={onSubmit}
                    />
                </WalletsWrapper>
            </Wrapper>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
