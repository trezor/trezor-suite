import { useRef } from 'react';

import { Category, Condition } from '@suite-common/suite-types';
import { Button, ButtonGroup, Menu, Popover, PopoverRef, Row, Text } from '@trezor/components';
import { spacings, zIndices } from '@trezor/theme';

type MessageSystemPresetControlsProps = {
    categories: ReadonlyArray<{ value: Category; label: string }>;
    availableConditions: ReadonlyArray<{ value: keyof Condition; label: string }>;
    canAddCondition: boolean;
    onPreset: (category: Category) => void;
    onAddCondition: (key: keyof Condition) => void;
};

export const MessageSystemPresetControls = ({
    categories,
    availableConditions,
    canAddCondition,
    onPreset,
    onAddCondition,
}: MessageSystemPresetControlsProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    return (
        <Row alignItems="center" gap={spacings.xs}>
            <Text>Preset:</Text>
            <ButtonGroup variant="tertiary" size="small">
                {categories.map(c => (
                    <Button key={c.value} onClick={() => onPreset(c.value)}>
                        {c.label}
                    </Button>
                ))}
            </ButtonGroup>

            <Popover
                ref={popoverRef}
                zIndex={zIndices.tooltip}
                content={
                    <Menu
                        items={availableConditions.map(opt => ({
                            label: opt.label,
                            onClick: () => {
                                onAddCondition(opt.value);
                                popoverRef.current?.close();
                            },
                        }))}
                    />
                }
            >
                <Button size="small" icon="plus" variant="tertiary" isDisabled={!canAddCondition}>
                    Condition
                </Button>
            </Popover>
        </Row>
    );
};
