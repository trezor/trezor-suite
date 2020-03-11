import React from 'react';
import { Button, colors } from '@trezor/components';
import { Translation } from '@suite-components';

import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';

interface Props {
    transport: BaseProps['suite']['transport'];
    goto: BaseProps['goto'];
}

const UpdateBridge = ({ transport, goto }: Props) => {
    if (!transport || !transport.outdated) return null;
    return (
        <Wrapper variant="info">
            <Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />
            <Button variant="tertiary" color={colors.WHITE} onClick={() => goto('suite-bridge')}>
                <Translation id="TR_SHOW_DETAILS" />
            </Button>
        </Wrapper>
    );
};

export default UpdateBridge;
