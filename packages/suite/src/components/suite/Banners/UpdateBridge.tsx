import React from 'react';

import { Translation } from 'src/components/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useActions } from 'src/hooks/suite';

import { Banner } from './Banner';

const UpdateBridge = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Banner
            variant="info"
            body={<Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />}
            action={{
                label: <Translation id="TR_SHOW_DETAILS" />,
                onClick: () => goto('suite-bridge'),
                'data-test': '@notification/update-bridge/button',
            }}
        />
    );
};

export default UpdateBridge;
