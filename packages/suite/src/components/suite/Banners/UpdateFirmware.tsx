import * as React from 'react';

import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';

const UpdateFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper
            variant="info"
            body={<Translation id="TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT" />}
            action={{
                label: <Translation id="TR_SHOW_DETAILS" />,
                onClick: () => goto('firmware-index'),
                'data-test': '@notification/update-firmware/button',
            }}
        />
    );
};

export default UpdateFirmware;
