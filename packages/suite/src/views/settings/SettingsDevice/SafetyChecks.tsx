import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Anchor, SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'safety-checks' }));

    return (
        <Anchor anchorId={SettingsAnchor.SafetyChecks}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE" />}
                        description={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC" />}
                    />
                    <ActionColumn>
                        <ActionButton
                            intent="brand"
                            onClick={handleClick}
                            data-testid="@settings/device/safety-checks-button"
                            isDisabled={isDeviceLocked}
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
