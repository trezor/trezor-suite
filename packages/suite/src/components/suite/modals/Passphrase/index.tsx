import React, { PureComponent, ChangeEvent } from 'react';
import styled from 'styled-components';

import { H5, P, Button, Input, Checkbox } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import modalsMessages from '../messages';
import messages from './messages';
import { TrezorDevice } from '@suite-types';

const TopMesssage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
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

interface Instance {
    instanceLabel: string;
}

interface State {
    value: string;
    valueAgain: string;
}

interface Props {
    device: TrezorDevice;
    instances?: TrezorDevice[];
    onEnterPassphrase: (device: TrezorDevice) => void;
}

class Passphrase extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            value: '',
            valueAgain: '',
        };
    }
    componentDidMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.props.onEnterPassphrase(this.props.device);
        }
    }

    handleValue(event: ChangeEvent): void {
        console.log(event);
        // this.setState((state: State) => {
        //     return {
        //         value: event.target.value,
        //         valueAgain: state.valueAgain,
        //     };
        // });
    }

    handleValueAgain(event: ChangeEvent): void {
        console.log(event);
        this.setState((state: State) => {
            return {
                value: state.value,
                valueAgain: state.valueAgain,
            };
        });
    }

    render() {
        const { device, instances, onEnterPassphrase } = this.props;
        const { value, valueAgain } = this.state;

        let { label } = device;
        if (instances && instances.length > 0) {
            label = instances.map((instance: Instance) => instance.instanceLabel).join(',');
        }
        return (
            <Wrapper>
                <H5>
                    <FormattedMessage
                        {...modalsMessages.TR_PASSPHRASE_LABEL}
                        values={{
                            deviceLabel: label,
                        }}
                    />
                </H5>
                <TopMesssage size="small">
                    <FormattedMessage {...messages.PASSPHRASE_CASE_SENSITIVE} />
                </TopMesssage>
                <FormRow>
                    <Input
                        onChange={event => this.handleValue(event)}
                        placeholder=""
                        topLabel="Passphrase"
                        type="text"
                        value={value}
                    />
                </FormRow>
                <FormRow>
                    <Input
                        onChange={event => this.handleValueAgain(event)}
                        placeholder=""
                        topLabel="Confirm Passphrase"
                        type="text"
                        value={valueAgain}
                    />
                </FormRow>
                <FormRow>
                    <Checkbox onClick={() => {}}>Show passphrase</Checkbox>
                </FormRow>
                <Column>
                    <Button onClick={() => onEnterPassphrase(device)}>
                        <FormattedMessage {...messages.TR_ENTER_PASSPHRASE} />
                    </Button>
                    <BottomMessage size="small">
                        <FormattedMessage {...messages.PASSPHRASE_BLANK} />
                    </BottomMessage>
                </Column>
            </Wrapper>
        );
    }
}

export default Passphrase;
