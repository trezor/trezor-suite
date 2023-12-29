import { analytics, EventType } from '@trezor/suite-analytics';

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

interface Props {
    isDeviceLocked: boolean;
}

export const WipeCode = ({ isDeviceLocked }: Props) => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.WipeCode);

    const handleClick = () => {
        dispatch(changeWipeCode({ remove: false }));
        analytics.report({
            type: EventType.SettingsDeviceChangeWipeCode,
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
                <ActionButton onClick={handleClick} isDisabled={isDeviceLocked} variant="danger">
                    <Translation id="TR_WIPE_CODE" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
