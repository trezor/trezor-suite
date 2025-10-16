import { useRef } from 'react';

import styled from 'styled-components';

import { CONTEXT_PATTERNS, FEATURE_LIST } from '@suite-common/message-system';
import { Category, Condition } from '@suite-common/suite-types';
import {
    Card,
    IconButton,
    Menu,
    NewButton,
    NewButtonGroup,
    Popover,
    PopoverRef,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { spacings, zIndices } from '@trezor/theme';

import { MessageSystemManual } from '../MessageSystemManual';

const ScrollContainer = styled.div`
    overflow-y: auto;
    max-height: 90vh;
`;

type MessageSystemManagerToolbarProps = {
    categories: ReadonlyArray<{ value: Category; label: string }>;
    availableConditions: ReadonlyArray<{ value: keyof Condition; label: string }>;
    canAddCondition: boolean;
    onPreset: (category: Category) => void;
    onAddCondition: (key: keyof Condition) => void;
};

export const MessageSystemManagerToolbar = ({
    categories,
    availableConditions,
    canAddCondition,
    onPreset,
    onAddCondition,
}: MessageSystemManagerToolbarProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    return (
        <Row justifyContent="space-between" alignItems="center">
            <Row alignItems="center" gap={spacings.xs}>
                <Text>Preset:</Text>
                <NewButtonGroup intent="neutral" priority="secondary" size="small">
                    {categories.map(c => (
                        <NewButton key={c.value} onClick={() => onPreset(c.value)}>
                            {c.label}
                        </NewButton>
                    ))}
                </NewButtonGroup>

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
                    <NewButton
                        size="small"
                        iconLeft="plus"
                        intent="neutral"
                        priority="secondary"
                        isDisabled={!canAddCondition}
                    >
                        Condition
                    </NewButton>
                </Popover>
            </Row>
            <Row gap={spacings.xs}>
                <Tooltip
                    content={
                        <div>
                            {Object.values(CONTEXT_PATTERNS)
                                .sort((a, b) => a.pattern.localeCompare(b.pattern))
                                .map(pattern => (
                                    <div key={pattern.pattern}>{pattern.pattern}</div>
                                ))}
                        </div>
                    }
                >
                    <NewButton
                        size="small"
                        iconLeft="codeBlockFilled"
                        intent="neutral"
                        priority="secondary"
                    >
                        Context patterns
                    </NewButton>
                </Tooltip>

                <Tooltip
                    content={
                        <div>
                            {FEATURE_LIST.map(feature => (
                                <div key={feature}>{feature}</div>
                            ))}
                        </div>
                    }
                >
                    <NewButton
                        size="small"
                        iconLeft="checkFat"
                        intent="neutral"
                        priority="secondary"
                    >
                        Feature list
                    </NewButton>
                </Tooltip>

                <Popover
                    content={
                        <Card>
                            <ScrollContainer>
                                <MessageSystemManual include={['message', 'conditions']} />
                            </ScrollContainer>
                        </Card>
                    }
                    zIndex={zIndices.tooltip}
                >
                    <IconButton icon="question" size="small" variant="tertiary" />
                </Popover>
            </Row>
        </Row>
    );
};
