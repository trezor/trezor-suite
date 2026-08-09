import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

// Suite Dark flavour: dedicated entry point to install the unofficial "Firmware Dark"
// build. It reuses the custom-firmware install flow (firmware-custom route +
// firmwareUpdate({ binary })) but with the `suiteDark` param, which makes the flow
// auto-download the firmware from the firmware-dark releases and show the
// unofficial-firmware / device-wipe warning instead of a file upload.
export const SuiteDarkFirmware = () => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const openModal = () =>
        dispatch(
            goto({
                routeName: 'firmware-custom',
                // `variant` is a generic modal-app route param already carried through the
                // router hash; we reuse it to switch the custom-firmware flow into the
                // Suite Dark (auto-download unofficial firmware) mode.
                params: { cancelable: true, variant: 'suitedark' },
            }),
        );

    return (
        <SectionItem data-testid="@settings/device/suite-dark-firmware">
            <TextColumn
                title={<Translation id="TR_SUITE_DARK_FIRMWARE_TITLE" />}
                description={<Translation id="TR_SUITE_DARK_FIRMWARE_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={openModal}
                    intent="critical"
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/suite-dark-firmware-button"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_SUITE_DARK_FIRMWARE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
