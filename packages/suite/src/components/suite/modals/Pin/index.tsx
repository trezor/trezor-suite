import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';

import { Button, ButtonPin, InputPin, P, H5, Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { TrezorDevice } from '@suite-types';
import messages from './messages';
import modalsMessages from '../messages';

const ModalWrapper = styled.div`
    padding: 30px 45px;
    width: 356px;
`;

const InputWrapper = styled.div`
    margin-top: 24px;
    margin-bottom: 10px;
`;

const PinRow = styled.div`
    display: flex;
    justify-content: space-between;
    button {
        width: 30%;
        height: 0;
        padding-bottom: 30%;
    }

    & + & {
        margin-top: 10px;
    }
`;

const PinFooter = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

const TopMessage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
`;

interface State {
    value: string;
}

interface Props {
    device: TrezorDevice;
    onEnterPin: (value: string) => void;
}

const Pin: FunctionComponent<Props> = ({ device, onEnterPin }) => {
    const [value, setValue] = useState<State['value']>('');

    return (
        <ModalWrapper>
            <H5>
                <FormattedMessage
                    {...messages.TR_ENTER_PIN}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H5>
            <TopMessage size="small">
                <FormattedMessage {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
            </TopMessage>
            <InputWrapper>
                <InputPin onDeleteClick={() => setValue(value.slice(0, -1))} value={value} />
            </InputWrapper>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}1`)} />
                <ButtonPin onClick={() => setValue(`${value}2`)} />
                <ButtonPin onClick={() => setValue(`${value}3`)} />
            </PinRow>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}4`)} />
                <ButtonPin onClick={() => setValue(`${value}5`)} />
                <ButtonPin onClick={() => setValue(`${value}6`)} />
            </PinRow>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}7`)} />
                <ButtonPin onClick={() => setValue(`${value}8`)} />
                <ButtonPin onClick={() => setValue(`${value}9`)} />
            </PinRow>
            <PinFooter>
                <Button onClick={() => onEnterPin(value)}>
                    <FormattedMessage {...messages.TR_ENTER_PIN} />
                </Button>
                <BottomMessage size="small">
                    <FormattedMessage {...messages.TR_HOW_PIN_WORKS} />{' '}
                    <Link href="https://wiki.trezor.io/User_manual:Entering_PIN" isGreen>
                        <FormattedMessage {...modalsMessages.TR_LEARN_MORE} />
                    </Link>
                </BottomMessage>
            </PinFooter>
        </ModalWrapper>
    );
};

export default Pin;
