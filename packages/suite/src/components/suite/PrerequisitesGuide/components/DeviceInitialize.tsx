// const DeviceInitialize = () => {
//     const { goto } = useActions({ goto: routerActions.goto });
//     return (
//         <DeviceInvalidModeLayout
//             data-test="@device-invalid-mode/initialize"
//             title={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
//             text={<Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />}
//             resolveButton={
//                 <Button
//                     data-test="@button/go-to-onboarding"
//                     onClick={() => goto('onboarding-index')}
//                 >
//                     <Translation id="TR_GO_TO_ONBOARDING" />
//                 </Button>
//             }
//             allowSwitchDevice
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

const DeviceInitialize = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            <TroubleshootingTips
                label={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
                cta={
                    <Button
                        data-test="@button/go-to-onboarding"
                        onClick={() => goto('onboarding-index')}
                    >
                        <Translation id="TR_GO_TO_ONBOARDING" />
                    </Button>
                }
                items={[
                    {
                        key: 'device-initialize',
                        heading: <Translation id="TR_DEVICE_NOT_INITIALIZED" />,
                        description: <Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />,
                    },
                ]}
            />
        </Wrapper>
    );
};

export default DeviceInitialize;
