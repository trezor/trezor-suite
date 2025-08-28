import { useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { selectIsAutoForgetDeviceDataEnabled } from '@suite-common/wallet-core';
import {
    Banner,
    Card,
    Column,
    Modal,
    ModalProps,
    Paragraph,
    Radio,
    Text,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';

import { setAutoForgetDeviceDataThunk } from 'src/actions/suite/autoForgetDeviceDataThunks';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

export const StoreDeviceDataModal = ({ onCancel }: ModalProps) => {
    const dispatch = useDispatch();

    // The redux logic is consistent with auto-eject (enabled = should forget),
    // but the UI here has inverted meaning (enabled = should store data)
    const isAutoForgetDeviceDataEnabled = useSelector(selectIsAutoForgetDeviceDataEnabled);
    const isStoreDeviceDataEnabled = !isAutoForgetDeviceDataEnabled;

    const [isStoreDataEnabled, setIsStoreDataEnabled] = useState(isStoreDeviceDataEnabled);

    const handleConfirmClick = () => {
        const shouldEnableAutoForget = !isStoreDataEnabled;
        dispatch(setAutoForgetDeviceDataThunk({ enabled: shouldEnableAutoForget }));

        analytics.report({
            type: EventType.SettingsGeneralStoreDeviceData,
            payload: { value: isStoreDataEnabled },
        });

        dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_STORE_DEVICE_DATA_MODAL_TITLE" />}
            variant="warning"
            size="small"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleConfirmClick}
                        data-testid="@store-device-data-apply"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Card margin={{ top: spacings.md }}>
                <Column gap={spacings.xl} alignItems="flex-start">
                    <Radio
                        isChecked={isStoreDataEnabled}
                        onClick={() => setIsStoreDataEnabled(true)}
                        data-testid="@store-device-data-radio-enabled"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="highlight">
                                <Translation id="TR_STORE_DEVICE_DATA_MODAL_ENABLED" />
                            </Text>
                            <Paragraph typographyStyle="hint">
                                <Translation id="TR_STORE_DEVICE_DATA_MODAL_ENABLED_DESCRIPTION" />
                            </Paragraph>
                        </Column>
                    </Radio>
                    <Radio
                        isChecked={!isStoreDataEnabled}
                        onClick={() => setIsStoreDataEnabled(false)}
                        data-testid="@store-device-data-radio-disabled"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="highlight">
                                <Translation id="TR_STORE_DEVICE_DATA_MODAL_DISABLED" />
                            </Text>
                            <Paragraph typographyStyle="hint">
                                <Translation id="TR_STORE_DEVICE_DATA_MODAL_DISABLED_DESCRIPTION" />
                            </Paragraph>
                        </Column>
                    </Radio>
                </Column>
            </Card>

            {isStoreDataEnabled ? null : (
                <Banner icon>
                    <Translation id="TR_STORE_DEVICE_DATA_MODAL_DISABLED_WARNING" />
                </Banner>
            )}
        </Modal>
    );
};

export const StoreDeviceData = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => setIsModalOpen(true);
    const handleModalCancel = () => setIsModalOpen(false);

    // TODO remove debug check when feature is complete
    const isDebug = useSelector(selectIsDebugModeActive);
    if (!isDebug) return null;

    return (
        <>
            <SettingsSectionItem anchorId={SettingsAnchor.StoreDeviceData}>
                <TextColumn
                    title={<Translation id="TR_DEVICE_SETTINGS_STORE_DEVICE_DATA_TITLE" />}
                    description={
                        <Translation id="TR_DEVICE_SETTINGS_STORE_DEVICE_DATA_DESCRIPTION" />
                    }
                    // TODO real link
                    buttonLink={EXPERIMENTAL_FEATURES_KB_URL}
                />
                <ActionColumn>
                    <ActionButton
                        variant="primary"
                        onClick={handleClick}
                        data-testid="@settings/device/store-device-data-button"
                    >
                        <Translation id="TR_DEVICE_SETTINGS_STORE_DEVICE_DATA_BUTTON" />
                    </ActionButton>
                </ActionColumn>
            </SettingsSectionItem>
            {isModalOpen && <StoreDeviceDataModal onCancel={handleModalCancel} />}
        </>
    );
};
