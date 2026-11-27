import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { showDeviceTutorialThunk } from '#src/actions/settings/deviceSettingsActions';

interface DeviceTutorialProps {
    isDeviceLocked: boolean;
}

export const DeviceTutorial = ({ isDeviceLocked }: DeviceTutorialProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const handleClick = async () => {
        const result = await dispatch(showDeviceTutorialThunk()).unwrap();

        if (result) {
            analytics.report({
                type: events.deviceLaunchTutorialEvent.name,
                payload: { source: 'settings', result },
            });
        }
    };

    return (
        <Anchor anchorId={SettingsAnchor.DeviceTutorial}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />}
                    description={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />}
                    actions={
                        <SectionItem.Button
                            data-testid="@settings/device/tutorial-button"
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            tooltip={{
                                isActive: isDeviceLocked,
                                content: (
                                    <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                ),
                            }}
                        >
                            <Translation id="TR_START" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
