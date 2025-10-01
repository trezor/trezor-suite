import { deviceStatuses, getStatus } from '@suite-common/suite-utils';
import { Collapsible, Column, Row, Select, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from '../../../hooks/suite';
import {
    selectIsDebugModeActive,
    selectPrerequisite,
} from '../../../selectors/suite/suiteSelectors';
import { prerequisiteTypes } from '../../../utils/suite/prerequisites';

type DebugWelcomeScreenPickerProps = {
    prerequisite: ReturnType<typeof selectPrerequisite>;
    setPrerequisite: (value: ReturnType<typeof selectPrerequisite>) => void;
    deviceStatus: ReturnType<typeof getStatus> | null;
    setDeviceStatus: (value: ReturnType<typeof getStatus> | null) => void;
};
export const DebugWelcomeScreenPicker = ({
    prerequisite,
    setPrerequisite,
    deviceStatus,
    setDeviceStatus,
}: DebugWelcomeScreenPickerProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    if (!isDebugModeActive) return null;

    return (
        <Collapsible>
            <Column gap={spacings.sm} margin={{ top: 12 }}>
                <Collapsible.Toggle>
                    <Row justifyContent="flex-end" flex="1">
                        <Tooltip content="Debug only: Change welcome screen">
                            <Collapsible.ToggleIcon size="medium" iconName="bug" />
                        </Tooltip>
                    </Row>
                </Collapsible.Toggle>
                <Collapsible.Content>
                    <Row gap={20}>
                        <Select
                            label="Device Status"
                            value={{ value: deviceStatus, label: deviceStatus }}
                            onChange={option => {
                                setDeviceStatus(option.value);
                            }}
                            options={deviceStatuses.map(item => ({ value: item, label: item }))}
                        />
                        <Select
                            label="Prerequisite"
                            value={{ value: prerequisite, label: prerequisite }}
                            onChange={option => {
                                setPrerequisite(option.value);
                            }}
                            options={prerequisiteTypes.map(item => ({
                                value: item,
                                label: item,
                            }))}
                        />
                    </Row>
                </Collapsible.Content>
            </Column>
        </Collapsible>
    );
};
