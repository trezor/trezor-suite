import * as React from 'react';
import { Translation } from '@suite-components';
import { Button, colors } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';

import { useActions } from '@suite-hooks';

import Wrapper from './components/Wrapper';

const UpdateFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper variant="info">
            <Translation id="TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT" />
            <Button
                variant="tertiary"
                color={colors.WHITE}
                onClick={() => goto('firmware-index')}
                data-test="@notification/update-firmware/button"
            >
                <Translation id="TR_SHOW_DETAILS" />
            </Button>
        </Wrapper>
    );
};

export default UpdateFirmware;
