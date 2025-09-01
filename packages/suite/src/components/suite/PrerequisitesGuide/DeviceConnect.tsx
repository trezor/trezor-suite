import { Button } from '@trezor/components';

import { toggleConnectionModal } from 'src/actions/device/deviceSlice';
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
        <Button minWidth={240} size="large" onClick={() => dispatch(toggleConnectionModal())}>
            <Translation id="TR_CONNECT" />
        </Button>
    );
};
