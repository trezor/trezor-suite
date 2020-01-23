import React, { useState, createRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useKeyPress } from '@suite-utils/dom';
import styled, { css } from 'styled-components';
import { Button, H2, P, colors, Input, Checkbox } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import Loading from '@suite-components/Loading';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceUtils from '@suite-utils/device';
import messages from '@suite/support/messages';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const Col = styled.div<{ secondary?: boolean }>`
    display: flex;
    flex: 1;
    width: 320px;
    flex-direction: column;
    padding: 40px;
    align-items: center;

    ${props =>
        props.secondary &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    color: ${colors.BLACK50};
`;

const Actions = styled.div`
    margin-top: 20px;
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
    const authConfirmation = props.getDiscoveryAuthConfirmationStatus() || props.device.authConfirm;
    const stateConfirmation = !!props.device.state;
    const hasEmptyPassphraseWallet = deviceUtils
        .getDeviceInstances(props.device, props.devices)
        .find(d => d.useEmptyPassphrase);
    const noPassphraseOffer = !hasEmptyPassphraseWallet && !stateConfirmation;
    const onDeviceOffer = props.device.features && props.device.features.session_id;

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
    let HEAD = 'Passphrase-secured hidden Wallet';
    let DESCRIPTION = `Enter existing passphrase to access existing hidden Wallet. Or enter new
    passphrase to create a new hidden Wallet.`;
    const INPUT_PLACEHOLDER = 'Enter passphrase';
    let BUTTON = 'Access Hidden Wallet';

    if (authConfirmation) {
        HEAD = 'Confirm empty hidden wallet';
        DESCRIPTION = `This hidden Wallet is empty. To make sure you are in the correct Wallet, confirm Passphrase.`;
        BUTTON = 'Confirm passphrase';
    } else if (stateConfirmation) {
        HEAD = 'Enter passphrase';
        DESCRIPTION = `Unlock.`;
        BUTTON = 'Enter';
    }

    return (
        <Wrapper>
            {noPassphraseOffer && (
                <Col>
                    <H2>No-passphrase Wallet</H2>
                    <Content>
                        To access standard (no-passphrase) Wallet click the button below.
                    </Content>
                    <Actions>
                        <Button variant="primary" onClick={() => submit()}>
                            Access standard Wallet
                        </Button>
                    </Actions>
                </Col>
            )}
            <Col secondary>
                <H2>{HEAD}</H2>
                <Content>{DESCRIPTION}</Content>
                {authConfirmation && (
                    <Content>
                        <Checkbox onClick={() => setEnabled(!enabled)} isChecked={enabled}>
                            I understand that Passphrase is not saved anywhere
                        </Checkbox>
                    </Content>
                )}
                <Content>
                    <Input
                        onChange={event => setValue(event.target.value)}
                        placeholder={INPUT_PLACEHOLDER}
                        type={inputType}
                        value={value}
                        innerRef={ref}
                        display="block"
                        variant="small"
                    />
                    <meter max="4" id="password-strength-meter" />
                    <P>TODO: strength indicator</P>
                </Content>
                <Content>
                    <Checkbox
                        onClick={() => setShowPassword(!showPassword)}
                        isChecked={showPassword}
                    >
                        <Translation {...messages.TR_SHOW_PASSPHRASE} />
                    </Checkbox>
                </Content>
                <Actions>
                    <Button isDisabled={!enabled} variant="secondary" onClick={() => submit()}>
                        {BUTTON}
                    </Button>
                    {onDeviceOffer && (
                        <Button
                            isDisabled={!enabled}
                            variant="secondary"
                            onClick={() => submit(true)}
                        >
                            Enter passphrase on device
                        </Button>
                    )}
                </Actions>
            </Col>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Passphrase);
