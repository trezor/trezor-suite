import * as React from 'react';

import { Translation } from 'src/components/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useActions } from 'src/hooks/suite';
import { Banner } from './Banner';

const UpdateFirmware = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Banner
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
