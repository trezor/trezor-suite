import { Column, Button } from '@trezor/components';

import { toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { WebUsbButton } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

export const DeviceConnect = () => {
    const dispatch = useDispatch();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    if (isWebUsbTransport) {
        return (
            <Column alignItems="center" margin={{ bottom: 40 }}>
                <WebUsbButton
                    size="medium"
                    data-testid="@webusb-button"
                    translationId="TR_CHECK_FOR_DEVICES"
                />
            </Column>
        );
    }

    return (
        <Column alignItems="center" margin={{ bottom: 40 }}>
            <Button minWidth={240} size="large" onClick={() => dispatch(toggleConnectionModal())}>
                <Translation id="TR_CONNECT" />
            </Button>
        </Column>
    );
};
