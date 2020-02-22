import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import * as STEP from '@onboarding-constants/steps';
import { AnyStepDisallowedState } from '@onboarding-types/steps';
import messages from '@suite/support/messages';
import Reconnect from './components/Reconnect';
import IsSameDevice from './components/IsSameDevice';
import IsNotNewDevice from './components/IsNotNewDevice';
import DeviceIsUsedHere from './components/DeviceIsUsedHere';

const Wrapper = styled.div`
    margin: auto 30px auto 30px;
    text-align: center;
    width: 100%;
`;

const IsNotInBootloader = () => (
    <P>
        <Translation>{messages.TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER}</Translation>
    </P>
);
interface UnexpectedStateProps {
    caseType: AnyStepDisallowedState;
    prevModel: number;
}

const UnexpectedState = ({ caseType, prevModel }: UnexpectedStateProps) => {
    const getComponent = () => {
        switch (caseType) {
            case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
                return <Reconnect model={prevModel} />;
            case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
                return <IsSameDevice />;
            case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
                return <IsNotInBootloader />;
            case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
                return <DeviceIsUsedHere />;
            case STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
                return <IsNotNewDevice />;
            default:
                throw new Error('no component found');
        }
    };

    const component = getComponent();

    return <Wrapper>{component}</Wrapper>;
};

export default UnexpectedState;
