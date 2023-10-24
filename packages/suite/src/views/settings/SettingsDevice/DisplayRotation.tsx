import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { variables } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const DISPLAY_ROTATIONS = [
    { label: <Translation id="TR_NORTH" />, value: 0 },
    { label: <Translation id="TR_EAST" />, value: 90 },
    { label: <Translation id="TR_SOUTH" />, value: 180 },
    { label: <Translation id="TR_WEST" />, value: 270 },
] as const;

const RotationButton = styled(ActionButton)`
    min-width: 81px;
    flex-basis: auto;

    &:not(:first-of-type) {
        @media (max-width: ${variables.SCREEN_SIZE.SM}) {
            margin-top: 10px;
        }
    }
`;

interface DisplayRotationProps {
    isDeviceLocked: boolean;
}

export const DisplayRotation = ({ isDeviceLocked }: DisplayRotationProps) => {
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.DisplayRotation);

    return (
        <SectionItem
            data-test="@settings/device/display-rotation"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn title={<Translation id="TR_DEVICE_SETTINGS_DISPLAY_ROTATION" />} />
            <ActionColumn>
                {DISPLAY_ROTATIONS.map(variant => (
                    <RotationButton
                        key={variant.value}
                        variant="secondary"
                        onClick={() => {
                            dispatch(applySettings({ display_rotation: variant.value }));
                            analytics.report({
                                type: EventType.SettingsDeviceChangeOrientation,
                                payload: {
                                    value: variant.value,
                                },
                            });
                        }}
                        data-test={`@settings/device/rotation-button/${variant.value}`}
                        isDisabled={isDeviceLocked}
                    >
                        {variant.label}
                    </RotationButton>
                ))}
            </ActionColumn>
        </SectionItem>
    );
};
