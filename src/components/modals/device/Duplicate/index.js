/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/buttons/Button';
import Input from 'components/Input';
import { getDuplicateInstanceNumber } from 'reducers/utils';
import { FONT_SIZE } from 'config/variables';
import Icon from 'components/Icon';
import icons from 'config/icons';
import colors from 'config/colors';
import Link from 'components/Link';

import { Props } from './index';

type State = {
    defaultName: string;
    instance: number;
    instanceName: ?string;
    isUsed: boolean;
}

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const Column = styled.div`
    display: flex;
    padding: 10px 0;
    flex-direction: column;
`;

const StyledP = styled(P)`
    padding: 10px 0px;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const Label = styled.div`
    display: flex;
    text-align: left;
    font-size: ${FONT_SIZE.SMALLER};
    flex-direction: column;
    padding-bottom: 5px;
`;

const ErrorMessage = styled.div`
    color: ${colors.ERROR_PRIMARY};
    font-size: ${FONT_SIZE.SMALLER};
    padding-top: 5px;
    text-align: center;
    width: 100%;
`;

export default class DuplicateDevice extends Component<Props, State> {
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    input: ?HTMLInputElement;

    constructor(props: Props) {
        super(props);

        const device = props.modal.opened ? props.modal.device : null;
        if (!device) return;

        const instance = getDuplicateInstanceNumber(props.devices, device);

        this.state = {
            defaultName: `${device.label} (${instance.toString()})`,
            instance,
            instanceName: null,
            isUsed: false,
        };
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13 && !this.state.isUsed) {
            event.preventDefault();
            this.submit();
        }
    }

    componentDidMount(): void {
        // one time autofocus
        if (this.input) this.input.focus();
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onNameChange = (value: string): void => {
        let isUsed: boolean = false;
        if (value.length > 0) {
            isUsed = (this.props.devices.find(d => d.instanceName === value) !== undefined);
        }

        this.setState({
            instanceName: value.length > 0 ? value : null,
            isUsed,
        });
    }

    submit() {
        if (!this.props.modal.opened) return;
        const extended: Object = { instanceName: this.state.instanceName, instance: this.state.instance };
        this.props.modalActions.onDuplicateDevice({ ...this.props.modal.device, ...extended });
    }

    render() {
        if (!this.props.modal.opened) return null;

        const { device } = this.props.modal;
        const { onCancel, onDuplicateDevice } = this.props.modalActions;
        const {
            defaultName,
            instanceName,
            isUsed,
        } = this.state;

        return (
            <Wrapper>
                <StyledLink onClick={onCancel}>
                    <Icon size={20} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
                </StyledLink>
                <H3>Clone { device.label }?</H3>
                <StyledP isSmaller>This will create new instance of device which can be used with different passphrase</StyledP>
                <Column>
                    <Label>Instance name</Label>
                    <Input
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        placeholder={defaultName}
                        innerRef={(element) => { this.input = element; }}
                        onChange={event => this.onNameChange(event.currentTarget.value)}
                        value={instanceName}
                    />
                    { isUsed && <ErrorMessage>Instance name is already in use</ErrorMessage> }
                </Column>
                <Column>
                    <StyledButton
                        disabled={isUsed}
                        onClick={() => this.submit()}
                    >Create new instance
                    </StyledButton>
                    <StyledButton
                        isWhite
                        onClick={onCancel}
                    >Cancel
                    </StyledButton>
                </Column>
            </Wrapper>
        );
    }
}