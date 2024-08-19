import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Warning } from '@trezor/components';

export const UpdateFirmware = () => {
    const dispatch = useDispatch();

    return (
        <Warning
            icon
            variant="info"
            rightContent={
                <Warning.Button
                    onClick={() => dispatch(goto('firmware-index'))}
                    data-testid="@notification/update-firmware/button"
                >
                    <Translation id="TR_SHOW_DETAILS" />
                </Warning.Button>
            }
        >
            <Translation id="TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT" />
        </Warning>
    );
};
