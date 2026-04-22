import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, goto } from '@suite/router';
import { getFirmwareDowngradeUrl } from '@suite-common/suite-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const CustomFirmware = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const firmwareDowngradeUrl = getFirmwareDowngradeUrl(device);

    const openModal = () =>
        dispatch(goto({ routeName: 'firmware-custom', params: { cancelable: true } }));

    return (
        <Anchor anchorId={SettingsAnchor.CustomFirmware}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
                        description={
                            <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION" />
                        }
                        bottomContent={
                            firmwareDowngradeUrl ? (
                                <LearnMoreButton url={firmwareDowngradeUrl} />
                            ) : undefined
                        }
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={openModal}
                            intent="critical"
                            isDisabled={isDeviceLocked}
                            data-testid="@settings/device/custom-firmware-modal-button"
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
