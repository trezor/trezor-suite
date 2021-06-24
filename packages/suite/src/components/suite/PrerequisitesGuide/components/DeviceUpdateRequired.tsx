// const Index = () => {
//     const { goto } = useActions({ goto: routerActions.goto });
//     return (
//         <DeviceInvalidModeLayout
//             data-test="@device-invalid-mode/update-required"
//             title={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
//             text={<Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />}
//             allowSwitchDevice
//             resolveButton={
//                 <Button onClick={() => goto('firmware-index')}>
//                     <Translation id="TR_SEE_DETAILS" />
//                 </Button>
//             }
//         />
//     );
// };

import React from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceUpdateRequired = () => {
    const { goto } = useActions({ goto: routerActions.goto });

    return (
        <Wrapper>
            <>
                <TroubleshootingTips
                    label={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
                    cta={
                        <Button onClick={() => goto('firmware-index')}>
                            <Translation id="TR_SEE_DETAILS" />
                        </Button>
                    }
                    items={[
                        {
                            key: 'device-firmware-required',
                            heading: <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />,
                            description: <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />,
                        },
                    ]}
                />
            </>
        </Wrapper>
    );
};

export default DeviceUpdateRequired;
