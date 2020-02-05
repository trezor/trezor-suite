import React, { useState, createRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useKeyPress } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, H2, Modal, colors, variables, Input, Checkbox } from '@trezor/components-v2';
// import { Translation } from '@suite-components/Translation';
import Loading from '@suite-components/Loading';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
// import messages from '@suite/support/messages';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import Link from '../../Link';
import { PASSPHRASE_URL } from '@suite-constants/urls';

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

const WalletTitle = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 12px;
`;

const AuthConfirmWrapper = styled.div<{ secondary?: boolean }>`
    display: flex;
    flex: 1;
    max-width: 360px;
    flex-direction: column;
    padding: 32px 24px;
    align-items: center;
    border-radius: 6px;
    background: ${colors.BLACK96};
`;

const Col = styled.div<{ secondary?: boolean }>`
    display: flex;
    flex: 1;
    width: 320px;
    flex-direction: column;
    padding: 32px 24px;
    align-items: center;
    border: solid 2px ${colors.BLACK96};
    border-radius: 6px;
    justify-self: center;

    ${props =>
        props.secondary &&
        css`
            background: ${colors.BLACK96};
        `}
        
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    color: ${colors.BLACK50};
    margin-bottom: 32px;
`;

const InputWrapper = styled(Content)`
    margin-bottom: 32px;
    width: 100%;
`;

const Actions = styled.div`
    width: 100%;
    /* margin-top: 20px; */
`;

const Padding = styled.div`
    display: flex;
    flex-direction: column;
    margin: 0px 24px;
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

    const [submitted, setSubmitted] = useState(false);
    const [enabled, setEnabled] = useState(!authConfirmation);
    const [value, setValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPassword ? 'text' : 'password';
    const enterPressed = useKeyPress('Enter');
    const ref = createRef<HTMLInputElement>();

    useEffect(() => {
        if (ref && ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    if (submitted) {
        return <Loading />;
    }

    const submit = (passphraseOnDevice?: boolean) => {
        if (!enabled) return;
        setSubmitted(true);
        props.onPassphraseSubmit(value, passphraseOnDevice);
    };

    if (enterPressed) {
        submit();
    }

    // TODO: translations
    const INPUT_PLACEHOLDER = 'Enter passphrase';

    if (authConfirmation || stateConfirmation) {
        // show borderless one-column modal for confirming passphrase and state confirmation
        return (
            <AuthConfirmWrapper>
                <WalletTitle>
                    {stateConfirmation ? 'Enter passphrase' : 'Confirm empty hidden wallet'}
                </WalletTitle>
                <Content>
                    {stateConfirmation
                        ? 'Unlock'
                        : 'This hidden Wallet is empty. To make sure you are in the correct Wallet, confirm Passphrase.'}
                </Content>
                <Padding>
                    {authConfirmation && (
                        <Content>
                            <Checkbox onClick={() => setEnabled(!enabled)} isChecked={enabled}>
                                I understand passphrase is not saved anywhere and can’t be restored.
                            </Checkbox>
                        </Content>
                    )}
                    <InputWrapper>
                        <Input
                            onChange={event => setValue(event.target.value)}
                            placeholder={INPUT_PLACEHOLDER}
                            type={inputType}
                            value={value}
                            innerRef={ref}
                            display="block"
                            variant="small"
                            button={{
                                icon: showPassword ? 'HIDE' : 'SHOW',
                                onClick: () => setShowPassword(!showPassword),
                            }}
                        />
                    </InputWrapper>
                    <Actions>
                        <Button
                            isDisabled={!enabled}
                            variant="primary"
                            onClick={() => submit()}
                            fullWidth
                        >
                            Confirm passphrase
                        </Button>
                        {onDeviceOffer && (
                            <Button
                                isDisabled={!enabled}
                                variant="secondary"
                                onClick={() => submit(true)}
                                fullWidth
                            >
                                Enter passphrase on device
                            </Button>
                        )}
                    </Actions>
                </Padding>
            </AuthConfirmWrapper>
        );
    }

    // show 2-column modal for selecting between standard and hidden wallets
    return (
        <Modal>
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
                        <Col>
                            <WalletTitle>No-passphrase Wallet</WalletTitle>
                            <Content>
                                To access standard (no-passphrase) Wallet click the button below.
                            </Content>
                            <Actions>
                                <Button variant="primary" fullWidth onClick={() => submit()}>
                                    Access standard Wallet
                                </Button>
                            </Actions>
                        </Col>
                    )}
                    <Col secondary>
                        <WalletTitle>Passphrase (hidden) wallet</WalletTitle>
                        <Content>
                            Enter existing passphrase to access existing hidden Wallet. Or enter new
                            passphrase to create a new hidden Wallet.
                        </Content>
                        <InputWrapper>
                            <Input
                                onChange={event => setValue(event.target.value)}
                                placeholder={INPUT_PLACEHOLDER}
                                type={inputType}
                                value={value}
                                innerRef={ref}
                                display="block"
                                variant="small"
                                button={{
                                    iconSize: 18,
                                    icon: showPassword ? 'HIDE' : 'SHOW',
                                    onClick: () => setShowPassword(!showPassword),
                                }}
                            />
                        </InputWrapper>
                        <Actions>
                            <Button
                                isDisabled={!enabled}
                                variant="secondary"
                                onClick={() => submit()}
                                fullWidth
                            >
                                Access Hidden Wallet
                            </Button>
                            {onDeviceOffer && (
                                <Button
                                    isDisabled={!enabled}
                                    variant="secondary"
                                    onClick={() => submit(true)}
                                    fullWidth
                                >
                                    Enter passphrase on device
                                </Button>
                            )}
                        </Actions>
                    </Col>
                </WalletsWrapper>
            </Wrapper>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
