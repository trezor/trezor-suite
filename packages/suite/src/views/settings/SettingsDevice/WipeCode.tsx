import { analytics, EventType } from '@trezor/suite-analytics';

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

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const WipeCode = ({ isDeviceLocked }: ChangePinProps) => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeCode);

    const handleClick = () => {
        dispatch(changeWipeCode({ remove: false }));
        analytics.report({
            type: EventType.SettingsDeviceChangePin,
        });
    };

    return (
        <SectionItem
            data-test="@settings/device/wipe-code"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_WIPE_CODE_DESC" />}
                buttonLink="https://trezor.io/learn/a/create-wipe-code-to-erase-device"
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    // TODO: Disable when pin is not set
                    variant="danger"
                >
                    <Translation id="TR_WIPE_CODE" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
