import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Button, H2, colors, variables } from '@trezor/components-v2';
// import { Translation } from '@suite-components/Translation';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
// import messages from '@suite/support/messages';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import Link from '../../Link';
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
    const authConfirmation = props.getDiscoveryAuthConfirmationStatus() || device.authConfirm;
    const stateConfirmation = !!device.state;
    const hasEmptyPassphraseWallet = deviceUtils
        .getDeviceInstances(device, props.devices)
        .find(d => d.useEmptyPassphrase);
    const noPassphraseOffer = !hasEmptyPassphraseWallet && !stateConfirmation;
    const onDeviceOffer =
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry');

    if (authConfirmation || stateConfirmation) {
        // show borderless one-column modal for confirming passphrase and state confirmation
        return (
            <PassphraseTypeCard
                authConfirmation={authConfirmation}
                title={stateConfirmation ? 'Enter passphrase' : 'Confirm empty hidden wallet'}
                description={
                    stateConfirmation
                        ? 'Unlock'
                        : 'This hidden Wallet is empty. To make sure you are in the correct Wallet, confirm Passphrase.'
                }
                submitLabel="Confirm passphrase"
                colorVariant="secondary"
                offerPassphraseOnDevice={onDeviceOffer}
                onPassphraseSubmit={props.onPassphraseSubmit}
                singleColModal
                showPassphraseInput
            />
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <ModalWrapper>
            <Wrapper>
                <H2>Select a wallet to access</H2>
                <Description>
                    Choose between no-passphrase or hidden wallet with passphrase.
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
                        What is passphrase
                    </Button>
                </Link>
                <WalletsWrapper>
                    {noPassphraseOffer && (
                        <PassphraseTypeCard
                            title="No-passphrase Wallet"
                            description="To access standard (no-passphrase) Wallet click the button below."
                            submitLabel="Access standard Wallet"
                            colorVariant="primary"
                            onPassphraseSubmit={props.onPassphraseSubmit}
                        />
                    )}
                    <PassphraseTypeCard
                        title="Passphrase (hidden) wallet"
                        description="Enter existing passphrase to access existing hidden Wallet. Or enter new
                            passphrase to create a new hidden Wallet."
                        submitLabel="Access Hidden Wallet"
                        colorVariant="secondary"
                        showPassphraseInput
                        onPassphraseSubmit={props.onPassphraseSubmit}
                    />
                </WalletsWrapper>
            </Wrapper>
        </ModalWrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
