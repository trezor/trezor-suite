import TrezorConnect from '@trezor/connect';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { variables, PassphraseTypeCard } from '@trezor/components';
import { useSelector, useDispatch } from '@suite-hooks';
import { onPassphraseSubmit } from '@suite-actions/modalActions';
import { selectIsDiscoveryAuthConfirmationRequired } from '@wallet-reducers/discoveryReducer';
import * as deviceUtils from '@suite-utils/device';
import { Translation, Modal } from '@suite-components';
import type { TrezorDevice } from '@suite-types';
import { OpenGuideFromTooltip } from '@guide-components';

const Wrapper = styled.div<{ authConfirmation?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;

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

const TinyModal = styled(Modal)`
    width: 450px;
`;

const SmallModal = styled(Modal)`
    width: 600px;
`;

type Props = {
    device: TrezorDevice;
};

export const Passphrase = ({ device }: Props) => {
    const [submitted, setSubmitted] = useState(false);
    const devices = useSelector(state => state.devices);
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const stateConfirmation = !!device.state;
    const hasEmptyPassphraseWallet = deviceUtils
        .getDeviceInstances(device, devices)
        .find(d => d.useEmptyPassphrase);
    const noPassphraseOffer = !hasEmptyPassphraseWallet && !stateConfirmation;
    const onDeviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    const dispatch = useDispatch();

    const onCancel = () => TrezorConnect.cancel('cancelled');

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            setSubmitted(true);
            dispatch(onPassphraseSubmit(value, !!passphraseOnDevice));
        },
        [setSubmitted, dispatch],
    );

    const onRecreate = useCallback(() => {
        // Cancel TrezorConnect request and pass error to suiteAction.authConfirm
        TrezorConnect.cancel('auth-confirm-cancel');
    }, []);

    if (submitted) {
        return null;
    }

    if (authConfirmation || stateConfirmation) {
        // show borderless one-column modal for confirming passphrase and state confirmation
        return (
            <TinyModal
                heading={
                    !authConfirmation ? (
                        <Translation id="TR_ENTER_PASSPHRASE" />
                    ) : (
                        <Translation id="TR_CONFIRM_EMPTY_HIDDEN_WALLET" />
                    )
                }
                isCancelable
                onCancel={onCancel}
                onBackClick={authConfirmation ? onRecreate : undefined}
                description={
                    !authConfirmation ? (
                        <Translation id="TR_UNLOCK" />
                    ) : (
                        <Translation id="TR_THIS_HIDDEN_WALLET_IS_EMPTY" />
                    )
                }
            >
                <PassphraseTypeCard
                    type="hidden"
                    authConfirmation={authConfirmation}
                    submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    singleColModal
                    learnMoreTooltipOnClick={instance => (
                        <OpenGuideFromTooltip
                            dataTest="@tooltip/guideAnchor"
                            id="/security/passphrase.md"
                            instance={instance}
                        />
                    )}
                />
            </TinyModal>
        );
    }

    // creating a hidden wallet
    if (!noPassphraseOffer) {
        return (
            <TinyModal
                heading={<Translation id="TR_PASSPHRASE_HIDDEN_WALLET" />}
                description={<Translation id="TR_HIDDEN_WALLET_MODAL_DESCRIPTION" />}
                isCancelable
                onCancel={onCancel}
            >
                <PassphraseTypeCard
                    title={<Translation id="TR_WALLET_SELECTION_HIDDEN_WALLET" />}
                    description={<Translation id="TR_HIDDEN_WALLET_DESCRIPTION" />}
                    submitLabel={<Translation id="TR_ACCESS_HIDDEN_WALLET" />}
                    type="hidden"
                    singleColModal
                    offerPassphraseOnDevice={onDeviceOffer}
                    onSubmit={onSubmit}
                    learnMoreTooltipOnClick={instance => (
                        <OpenGuideFromTooltip
                            dataTest="@tooltip/guideAnchor"
                            id="/security/passphrase.md"
                            instance={instance}
                        />
                    )}
                />
            </TinyModal>
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <SmallModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_SELECT_WALLET_TO_ACCESS" />}
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
                        learnMoreTooltipOnClick={instance => (
                            <OpenGuideFromTooltip
                                dataTest="@tooltip/guideAnchor"
                                id="/security/passphrase.md"
                                instance={instance}
                            />
                        )}
                    />
                </WalletsWrapper>
            </Wrapper>
        </SmallModal>
    );
};
