import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { SectionItem } from '@trezor/product-components';

import { useModalLoader } from '#src/hooks/suite/useModalLoader';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const { open, isLoading } = useModalLoader();

    const handleClick = () => open({ type: 'safety-checks' });

    return (
        <Anchor anchorId={SettingsAnchor.SafetyChecks}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE" />}
                    description={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC" />}
                    actions={
                        <SectionItem.Button
                            intent="brand"
                            onClick={handleClick}
                            isLoading={isLoading}
                            data-testid="@settings/device/safety-checks-button"
                            isDisabled={isDeviceLocked}
                            tooltip={{
                                isActive: isDeviceLocked,
                                content: (
                                    <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                ),
                            }}
                        >
                            <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
