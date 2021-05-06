import React from 'react';
import styled from 'styled-components';
import { Translation, WebusbButton, Image } from '@suite-components';
import { Wrapper, Text } from '@onboarding-components';

const ButtonWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    margin-top: 20px;
`;

interface Props {
    showWebUsb: boolean;
}

const Reconnect = ({ showWebUsb }: Props) => (
    <Wrapper.Step data-test="@onboarding/unexpected-state/reconnect">
        <Wrapper.StepHeading>
            <Translation id="TR_RECONNECT_HEADER" />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Image width="360" image="CONNECT_DEVICE" />
            <Text>
                <Translation id="TR_RECONNECT_TEXT" />
            </Text>
            <Text>---</Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CONNECTION" />
            </Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_CABLE" />
            </Text>
            <Text>
                <Translation id="TR_RECONNECT_TROUBLESHOOT_BRIDGE" />
            </Text>

            {showWebUsb && (
                <ButtonWrapper>
                    <WebusbButton />
                </ButtonWrapper>
            )}
        </Wrapper.StepBody>
    </Wrapper.Step>
);
export default Reconnect;
