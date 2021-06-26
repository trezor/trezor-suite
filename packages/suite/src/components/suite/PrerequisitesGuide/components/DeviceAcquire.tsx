// const Acquire = () => {
//     const { device, isLocked } = useDevice();
//     const { acquireDevice } = useActions({
//         acquireDevice: suiteActions.acquireDevice,
//     });

//     if (!device) return null;
//     return (
//         <DeviceInvalidModeLayout
//             title={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
//             text={<Translation id="TR_ACQUIRE_DEVICE_DESCRIPTION" />}
//             image="DEVICE_ANOTHER_SESSION"
//             resolveButton={
//                 <Button isLoading={isLocked()} onClick={() => acquireDevice()}>
//                     <Translation id="TR_ACQUIRE_DEVICE" />
//                 </Button>
//             }
//         />
//     );
// };

import React from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceAcquire = () => {
    const { isLocked } = useDevice();
    const { acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
    });
    return (
        <Wrapper>
            <>
                <TroubleshootingTips
                    label={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
                    cta={
                        <Button
                            isLoading={isLocked()}
                            onClick={e => {
                                e.stopPropagation();
                                acquireDevice();
                            }}
                        >
                            <Translation id="TR_ACQUIRE_DEVICE" />
                        </Button>
                    }
                    items={[
                        {
                            key: 'device-acquire',
                            heading: <Translation id="TR_ACQUIRE_DEVICE_TITLE" />,
                            description: <Translation id="TR_ACQUIRE_DEVICE_DESCRIPTION" />,
                        },
                    ]}
                />
            </>
        </Wrapper>
    );
};

export default DeviceAcquire;
