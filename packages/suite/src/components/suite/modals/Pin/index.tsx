import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';

import { Button, ButtonPin, InputPin, P, H5, Link } from '@trezor/components';
import { TrezorDevice } from '@suite-types';

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

const TopMesssage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
`;

interface State {
    value: string;
}

interface Props {
    device: TrezorDevice;
    instances?: TrezorDevice[];
    onEnterPin: (device: TrezorDevice) => void;
}

const Pin: FunctionComponent<Props> = ({ device, onEnterPin }) => {
    const [value, setValue] = useState<State['value']>('');

    return (
        <ModalWrapper>
            <H5>Enter Trezor PIN</H5>
            <TopMesssage size="small">The PIN layout is displayed on your Trezor.</TopMesssage>
            <InputWrapper>
                <InputPin onDeleteClick={() => setValue(value.slice(0, -1))} value={value} />
            </InputWrapper>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}${1}`)} />
                <ButtonPin onClick={() => setValue(`${value}${2}`)} />
                <ButtonPin onClick={() => setValue(`${value}${3}`)} />
            </PinRow>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}${4}`)} />
                <ButtonPin onClick={() => setValue(`${value}${5}`)} />
                <ButtonPin onClick={() => setValue(`${value}${6}`)} />
            </PinRow>
            <PinRow>
                <ButtonPin onClick={() => setValue(`${value}${7}`)} />
                <ButtonPin onClick={() => setValue(`${value}${8}`)} />
                <ButtonPin onClick={() => setValue(`${value}${9}`)} />
            </PinRow>
            <PinFooter>
                <Button onClick={() => onEnterPin(device)}>Enter PIN</Button>
                <BottomMessage size="small">
                    Not sure how PIN works?{' '}
                    <Link href="https://wiki.trezor.io/User_manual:Entering_PIN" isGreen>
                        Learn more
                    </Link>
                </BottomMessage>
            </PinFooter>
        </ModalWrapper>
    );
};

export default Pin;
