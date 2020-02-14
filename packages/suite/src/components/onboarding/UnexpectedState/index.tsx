import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import { connect } from 'react-redux';

import * as STEP from '@onboarding-constants/steps';
import { AnyStepDisallowedState } from '@onboarding-types/steps';
import messages from '@suite/support/messages';
import Reconnect from './components/Reconnect';
import IsSameDevice from './components/IsSameDevice';
import IsNotNewDevice from './components/IsNotNewDevice';

const CommonWrapper = styled.div`
    margin: auto 30px auto 30px;
    text-align: center;
    width: 100%;
`;

const UnexpectedStateCommon = ({ children }: { children: ReactNode }) => (
    <CommonWrapper>{children}</CommonWrapper>
);

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
    switch (caseType) {
        case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
            return (
                <UnexpectedStateCommon>
                    <Reconnect model={prevModel} />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
            return (
                <UnexpectedStateCommon>
                    <IsSameDevice />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
            return (
                <UnexpectedStateCommon>
                    <IsNotInBootloader />
                </UnexpectedStateCommon>
            );
        // todo: test it is handled properly by action modal

        // todo: test it is handled properly by application state modal

        // case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
        //     return (
        //         <UnexpectedStateCommon>
        //             <DeviceIsUsedHere actionCta={getFeatures} />
        //         </UnexpectedStateCommon>
        //     );
        case STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
            return (
                <UnexpectedStateCommon>
                    <IsNotNewDevice />
                </UnexpectedStateCommon>
            );
        default:
            return <UnexpectedStateCommon>Error: {caseType}</UnexpectedStateCommon>;
    }
};

export default connect(null, null)(UnexpectedState);
