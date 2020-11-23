import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { isDesktop } from '@suite-utils/env';

import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';

interface Props {
    transport: BaseProps['suite']['transport'];
    goto: BaseProps['goto'];
}

const UpdateBridge = ({ transport, goto }: Props) => {
    if (!transport || !transport.outdated) return null;
    if (isDesktop()) {
        // we can work with these versions of bridge too
        if (transport.version && ['2.0.27', '2.0.28', '2.0.29'].includes(transport.version))
            return null;
    }
    return (
        <Wrapper variant="info">
            <Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />
            <Button variant="tertiary" onClick={() => goto('suite-bridge')}>
                <Translation id="TR_SHOW_DETAILS" />
            </Button>
        </Wrapper>
    );
};

export default UpdateBridge;
