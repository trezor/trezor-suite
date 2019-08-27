import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';

import { H5, P, Button, Input, Checkbox, colors } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { useKeyPress } from '@suite-utils/hooks';

import modalsMessages from '../messages';
import messages from './messages';
import { TrezorDevice } from '@suite-types';

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
    onEnterPassphrase: (device: TrezorDevice, value: string) => void;
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
    const type: State['type'] = showPassword ? 'text' : 'password';
    const passwordsMatch = shouldShowSingleInput || showPassword ? true : value === valueAgain;
    const enterPressed = useKeyPress('Enter');

    if (enterPressed) {
        onEnterPassphrase(device, value);
    }

    return (
        <Wrapper>
            <H5>
                <FormattedMessage
                    {...modalsMessages.TR_PASSPHRASE_LABEL}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H5>
            <TopMessage size="small">
                <FormattedMessage {...messages.PASSPHRASE_CASE_SENSITIVE} />
            </TopMessage>
            <FormRow>
                <Input
                    onChange={event => setValue(event.target.value)}
                    placeholder=""
                    topLabel="Passphrase"
                    type={type}
                    value={value}
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
                <Checkbox onClick={() => setShowPassword(!showPassword)} isChecked={showPassword}>
                    Show passphrase
                </Checkbox>
            </FormRow>
            <Column>
                <Button
                    onClick={() => onEnterPassphrase(device, value)}
                    isDisabled={!passwordsMatch}
                >
                    <FormattedMessage {...messages.TR_ENTER_PASSPHRASE} />
                </Button>
                <ErrorMessage size="small" show={!passwordsMatch}>
                    <FormattedMessage {...messages.PASSPHRASE_DO_NOT_MATCH} />
                </ErrorMessage>
                <BottomMessage size="small">
                    <FormattedMessage {...messages.PASSPHRASE_BLANK} />
                </BottomMessage>
            </Column>
        </Wrapper>
    );
};

export default Passphrase;
