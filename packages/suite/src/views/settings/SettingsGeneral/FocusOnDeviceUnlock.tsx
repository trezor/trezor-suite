import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectFocusOnDeviceUnlock, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const FocusOnDeviceUnlock = () => {
    const focusOnDeviceUnlock = useSelector(selectFocusOnDeviceUnlock);
    const dispatch = useDispatch();

    const handleChange = () => {
        dispatch(suiteSettingsActions.setFocusOnDeviceUnlock(!focusOnDeviceUnlock));
    };

    return (
        <Anchor anchorId={SettingsAnchor.FocusOnDeviceUnlock}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_FOCUS_ON_DEVICE_UNLOCK_TITLE" />}
                        description={<Translation id="TR_FOCUS_ON_DEVICE_UNLOCK_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <Switch
                            data-testid="@settings/general/focus-on-device-unlock-switch"
                            isChecked={focusOnDeviceUnlock}
                            onChange={handleChange}
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
