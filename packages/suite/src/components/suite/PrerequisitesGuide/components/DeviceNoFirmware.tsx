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

const DeviceNoFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            <TroubleshootingTips
                label={<Translation id="TR_NO_FIRMWARE" />}
                cta={
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            goto('onboarding-index');
                        }}
                    >
                        <Translation id="TR_GO_TO_ONBOARDING" />
                    </Button>
                }
                items={[
                    {
                        key: 'device-firmware-missing',
                        heading: <Translation id="TR_NO_FIRMWARE" />,
                        description: <Translation id="TR_NO_FIRMWARE_EXPLAINED" />,
                    },
                ]}
            />
        </Wrapper>
    );
};

export default DeviceNoFirmware;
