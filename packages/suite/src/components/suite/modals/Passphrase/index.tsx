import TrezorConnect from 'trezor-connect';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Button, Link, H2, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
import Loading from '@suite-components/Loading';

import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import ModalWrapper from '@suite-components/ModalWrapper';
import { PASSPHRASE_URL } from '@suite-constants/urls';
import PassphraseTypeCard from './components/PassphraseTypeCard';

const Wrapper = styled.div<{ authConfirmation?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: ${props => (props.authConfirmation ? 'auto' : '660px')};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const WalletsWrapper = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    margin-top: 42px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 4px;
`;

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
    onPassphraseSubmit: bindActionCreators(modalActions.onPassphraseSubmit, dispatch),
});

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
            <PassphraseTypeCard
                authConfirmation={authConfirmation}
                recreateWallet={authConfirmation ? onRecreate : undefined}
                title={
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
                submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                colorVariant="secondary"
                offerPassphraseOnDevice={onDeviceOffer}
                onSubmit={onSubmit}
                singleColModal
                showPassphraseInput
            />
        );
    }

    // creating a hidden wallet
    if (!noPassphraseOffer) {
        return (
            <PassphraseTypeCard
                title={<Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />}
                description={<Translation id="TR_ENTER_EXISTING_PASSPHRASE" />}
                submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                colorVariant="secondary"
                offerPassphraseOnDevice={onDeviceOffer}
                showPassphraseInput
                singleColModal
                onSubmit={onSubmit}
            />
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <ModalWrapper>
            <Wrapper>
                <H2>
                    <Translation id="TR_SELECT_WALLET_TO_ACCESS" />
                </H2>
                <Description>
                    <Translation id="TR_CHOOSE_BETWEEN_NO_PASSPHRASE" />
                </Description>
                <Link variant="nostyle" href={PASSPHRASE_URL}>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="EXTERNAL_LINK"
                        alignIcon="right"
                        color={colors.BLACK25}
                        onClick={() => {}}
                    >
                        <Translation id="TR_WHAT_IS_PASSPHRASE" />
                    </Button>
                </Link>
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
        </ModalWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
