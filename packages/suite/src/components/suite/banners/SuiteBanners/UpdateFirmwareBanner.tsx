import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from '../Banner';

export const UpdateFirmware = () => {
    const dispatch = useDispatch();

    const action = {
        label: <Translation id="TR_SHOW_DETAILS" />,
        onClick: () => dispatch(goto('firmware-index')),
        'data-test-id': '@notification/update-firmware/button',
    };

    return (
        <Banner
            variant="info"
            body={<Translation id="TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT" />}
            action={action}
        />
    );
};
