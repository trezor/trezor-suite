import { analytics, EventType } from '@trezor/suite-analytics';
import { useSelector } from 'react-redux';

import { HELP_CENTER_WIPE_CODE_URL } from '@trezor/urls';
import { changeWipeCode } from 'src/actions/settings/deviceSettingsActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch } from 'src/hooks/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { selectIsDeviceProtectedByWipeCode } from '@suite-common/wallet-core';

interface Props {
    isDeviceLocked: boolean;
}

export const WipeCode = ({ isDeviceLocked }: Props) => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeCode);
    const isDeviceProtectedByWipeCode = useSelector(selectIsDeviceProtectedByWipeCode);

    const enableWipeCode = () => {
        dispatch(changeWipeCode({ remove: false }));
        analytics.report({
            type: isDeviceProtectedByWipeCode
                ? EventType.SettingsDeviceChangeWipeCode
                : EventType.SettingsDeviceSetupWipeCode,
        });
    };

    const disableWipeCode = () => {
        dispatch(changeWipeCode({ remove: true }));
        analytics.report({
            type: EventType.SettingsDeviceDisableWipeCode,
        });
    };

    return (
        <SectionItem
            data-test="@settings/device/change-wipe-code"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_DESC" />}
                buttonLink={HELP_CENTER_WIPE_CODE_URL}
            />

            <ActionColumn>
                <ActionButton onClick={enableWipeCode} isDisabled={isDeviceLocked} variant="danger">
                    <Translation
                        id={
                            isDeviceProtectedByWipeCode
                                ? 'TR_CHANGE_WIPE_CODE'
                                : 'TR_SETUP_WIPE_CODE'
                        }
                    />
                </ActionButton>

                {isDeviceProtectedByWipeCode && (
                    <ActionButton
                        onClick={disableWipeCode}
                        isDisabled={isDeviceLocked}
                        variant="danger"
                    >
                        <Translation id="TR_REMOVE_WIPE_CODE" />
                    </ActionButton>
                )}
            </ActionColumn>
        </SectionItem>
    );
};
