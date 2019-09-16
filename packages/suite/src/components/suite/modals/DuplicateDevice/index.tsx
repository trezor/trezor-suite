import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';

import { H5, P, Button, Input, colors, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { useKeyPress } from '@suite-utils/hooks';
import { getNewInstanceNumber } from '@suite-utils/device';

import { TrezorDevice, AcquiredDevice } from '@suite-types';

import l10nMessages from './messages';
import l10CommonnMessages from '../messages';

interface Props {
    device: AcquiredDevice;
    devices: TrezorDevice[];
    onDuplicateDevice: (device: AcquiredDevice) => void;
    onCancel: () => void;
}

interface State {
    instanceLabel?: string;
    isUsed: boolean;
}

const { FONT_SIZE } = variables;

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const Column = styled.div`
    display: flex;
    padding: 10px 0;
    flex-direction: column;
`;

const StyledP = styled(P)`
    && {
        padding: 10px 0px;
    }
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const Label = styled.div`
    display: flex;
    text-align: left;
    font-size: ${FONT_SIZE.SMALL};
    flex-direction: column;
    padding-bottom: 5px;
`;

const ErrorMessage = styled.div`
    color: ${colors.ERROR_PRIMARY};
    font-size: ${FONT_SIZE.SMALL};
    padding-top: 5px;
    text-align: center;
    width: 100%;
`;

const DuplicateDevice: FunctionComponent<Props> = ({
    device,
    devices,
    onDuplicateDevice,
    onCancel,
}) => {
    const instance = getNewInstanceNumber(devices, device);
    const defaultName = `${device.label} (${instance ? instance.toString() : ''})`;

    const [isUsed, setIsUsed] = useState<State['isUsed']>(false);
    const [instanceLabel, setInstanceLabel] = useState<State['instanceLabel']>('');

    const enterPressed = useKeyPress('Enter');

    const submit = () => {
        const extended: Record<string, any> = {
            instanceLabel,
            instance,
        };
        const d = { ...device, ...extended };
        onDuplicateDevice(d);
    };

    const onNameChange = (value: string): void => {
        if (value.length > 0) {
            setIsUsed(devices.find(d => d.instanceLabel === value) !== undefined);
        } else {
            setIsUsed(false);
        }
        setInstanceLabel(value.length > 0 ? value : '');
    };

    if (enterPressed && !isUsed) {
        submit();
    }

    return (
        <Wrapper>
            <H5>
                <FormattedMessage
                    {...l10nMessages.TR_CLONE}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H5>
            <StyledP size="small">
                <FormattedMessage {...l10nMessages.TR_THIS_WILL_CREATE_NEW_INSTANCE} />
            </StyledP>
            <Column>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_INSTANCE_NAME} />
                </Label>
                <Input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={defaultName}
                    onChange={event => onNameChange(event.currentTarget.value)}
                    value={instanceLabel}
                />
                {isUsed && (
                    <ErrorMessage>
                        <FormattedMessage {...l10nMessages.TR_INSTANCE_NAME_IN_USE} />
                    </ErrorMessage>
                )}
            </Column>
            <Column>
                <StyledButton disabled={isUsed} onClick={() => submit()}>
                    <FormattedMessage {...l10nMessages.TR_CREATE_NEW_INSTANCE} />
                </StyledButton>
                <StyledButton isWhite onClick={onCancel}>
                    <FormattedMessage {...l10CommonnMessages.TR_CANCEL} />
                </StyledButton>
            </Column>
        </Wrapper>
    );
};

export default DuplicateDevice;
