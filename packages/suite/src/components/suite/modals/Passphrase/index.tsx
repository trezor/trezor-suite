import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';
import { useKeyPress } from '@suite-utils/dom';
import messages from '@suite/support/messages';
import { Checkbox, colors, Input } from '@trezor/components';
import { Button, H2, P } from '@trezor/components-v2';
import React, { createRef, FunctionComponent, useEffect, useState } from 'react';
import styled from 'styled-components';

const TopMessage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 0 30px;
`;

const ErrorMessage = styled(P)<Error>`
    padding: 10px 0 0;
    opacity: ${props => (props.show ? 1 : 0)};
    color: ${colors.ERROR_PRIMARY};
`;

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const FormRow = styled.div`
    text-align: left;
    padding: 15px 0;
`;

interface Error {
    show: boolean;
}

interface State {
    value: string;
    valueAgain: string;
    type: 'password' | 'text';
}

interface Props {
    device: TrezorDevice;
    onEnterPassphrase: (value: string) => void;
    shouldShowSingleInput?: boolean;
}

const Passphrase: FunctionComponent<Props> = ({
    device,
    onEnterPassphrase,
    shouldShowSingleInput,
}) => {
    const [value, setValue] = useState<State['value']>('');
    const [valueAgain, setValueAgain] = useState<State['valueAgain']>('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusInput, setFocusInput] = useState(true);
    const type: State['type'] = showPassword ? 'text' : 'password';
    const passwordsMatch = shouldShowSingleInput || showPassword ? true : value === valueAgain;
    const enterPressed = useKeyPress('Enter');
    const ref = createRef<HTMLInputElement>();

    const handleShowPassword = () => {
        if (showPassword) {
            setValueAgain(value);
        }
        setShowPassword(!showPassword);
    };

    const handleSetValue = (value: string) => {
        if (showPassword) {
            setValueAgain(value);
        }
        setValue(value);
    };

    if (enterPressed) {
        onEnterPassphrase(value);
    }

    useEffect(() => {
        if (ref && ref.current && focusInput) {
            ref.current.focus();
            setFocusInput(false);
        }
    }, [ref, focusInput]);

    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_PASSPHRASE_LABEL}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H2>
            <TopMessage size="small">
                <Translation {...messages.TR_PASSPHRASE_CASE_SENSITIVE} />
            </TopMessage>
            <FormRow>
                <Input
                    onChange={event => handleSetValue(event.target.value)}
                    placeholder=""
                    topLabel="Passphrase"
                    type={type}
                    value={value}
                    innerRef={ref}
                />
            </FormRow>
            {!shouldShowSingleInput && (
                <FormRow>
                    <Input
                        onChange={event => setValueAgain(event.target.value)}
                        placeholder=""
                        topLabel="Confirm Passphrase"
                        type={type}
                        value={showPassword ? value : valueAgain}
                        disabled={!!showPassword}
                    />
                </FormRow>
            )}
            <FormRow>
                <Checkbox onClick={() => handleShowPassword()} isChecked={showPassword}>
                    <Translation {...messages.TR_SHOW_PASSPHRASE} />
                </Checkbox>
            </FormRow>
            <Column>
                <Button onClick={() => onEnterPassphrase(value)} isDisabled={!passwordsMatch}>
                    <Translation {...messages.TR_ENTER_PASSPHRASE} />
                </Button>
                <ErrorMessage size="small" show={!passwordsMatch}>
                    <Translation {...messages.TR_PASSPHRASE_DO_NOT_MATCH} />
                </ErrorMessage>
                <BottomMessage size="small">
                    <Translation {...messages.TR_PASSPHRASE_BLANK} />
                </BottomMessage>
            </Column>
        </Wrapper>
    );
};

export default Passphrase;
