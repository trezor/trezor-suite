import { deviceActions } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { Translation, WebUsbButton } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

export const DeviceConnect = () => {
    const dispatch = useDispatch();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    if (isWebUsbTransport) {
        return <WebUsbButton data-testid="@webusb-button" translationId="TR_CHECK_FOR_DEVICES" />;
    }

    return (
        <Button onClick={() => dispatch(deviceActions.toggleConnectionModal())}>
            <Translation id="TR_CONNECT" />
        </Button>
    );
};
