import { deviceActions } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const DeviceConnect = () => {
    const dispatch = useDispatch();

    return (
        <Button onClick={() => dispatch(deviceActions.toggleConnectionModal())}>
            <Translation id="TR_CONNECT" />
        </Button>
    );
};
