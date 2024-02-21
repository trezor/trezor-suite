import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface SafetyChecksProps {
    isDeviceLocked: boolean;
}

export const SafetyChecks = ({ isDeviceLocked }: SafetyChecksProps) => {
    const dispatch = useDispatch();

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.SafetyChecks);

    const handleClick = () => dispatch(openModal({ type: 'safety-checks' }));

    return (
        <SectionItem
            data-test-id="@settings/device/safety-checks"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={handleClick}
                    data-test-id="@settings/device/safety-checks-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation id="TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
