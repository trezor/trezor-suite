import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

import Wrapper from './components/Wrapper';

const UpdateBridge = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
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
