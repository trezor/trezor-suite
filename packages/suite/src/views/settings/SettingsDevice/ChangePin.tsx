import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

import { changePinThunk } from 'src/actions/settings/deviceSettingsActions';

interface ChangePinProps {
    isDeviceLocked: boolean;
}

export const ChangePin = ({ isDeviceLocked }: ChangePinProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const handleClick = () => {
        dispatch(changePinThunk({ remove: false }));
        analytics.report({
            type: events.settingsDeviceChangePinEvent.name,
        });
    };

    return (
        <Anchor anchorId={SettingsAnchor.ChangePin}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE" />}
                    description={<Translation id="TR_DEVICE_SETTINGS_CHANGE_PIN_DESC" />}
                    actions={
                        <SectionItem.Button
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            intent="brand"
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_CHANGE_PIN" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
