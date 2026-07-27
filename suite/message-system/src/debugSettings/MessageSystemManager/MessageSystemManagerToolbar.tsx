import { useRef } from 'react';

import styled from 'styled-components';

import { CONTEXT_PATTERNS, FEATURE_LIST } from '@suite-common/message-system';
import { type Category, type Condition } from '@suite-common/suite-types';
import {
    Button,
    ButtonGroup,
    Card,
    Column,
    IconButton,
    Menu,
    Popover,
    type PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { CheckFatIcon, CodeBlockFilledIcon, PlusIcon, QuestionIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

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
            <Row alignItems="center" gap={8}>
                <Text>Preset:</Text>
                <ButtonGroup intent="neutral" priority="secondary" size="small">
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
                    <Button
                        size="small"
                        iconLeft={PlusIcon}
                        intent="neutral"
                        priority="secondary"
                        isDisabled={!canAddCondition}
                    >
                        Condition
                    </Button>
                </Popover>
            </Row>
            <Row gap={8}>
                <Popover
                    content={
                        <Card>
                            <ScrollContainer>
                                <Column gap={4}>
                                    {Object.values(CONTEXT_PATTERNS)
                                        .sort((a, b) => a.pattern.localeCompare(b.pattern))
                                        .map(pattern => (
                                            <div key={pattern.pattern}>{pattern.pattern}</div>
                                        ))}
                                </Column>
                            </ScrollContainer>
                        </Card>
                    }
                    zIndex={zIndices.tooltip}
                >
                    <Button
                        size="small"
                        iconLeft={CodeBlockFilledIcon}
                        intent="neutral"
                        priority="secondary"
                    >
                        Context patterns
                    </Button>
                </Popover>

                <Popover
                    content={
                        <Card>
                            <ScrollContainer>
                                <Column gap={4}>
                                    {FEATURE_LIST.map(feature => (
                                        <div key={feature}>{feature}</div>
                                    ))}
                                </Column>
                            </ScrollContainer>
                        </Card>
                    }
                    zIndex={zIndices.tooltip}
                >
                    <Button
                        size="small"
                        iconLeft={CheckFatIcon}
                        intent="neutral"
                        priority="secondary"
                    >
                        Feature list
                    </Button>
                </Popover>

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
                    <IconButton
                        icon={QuestionIcon}
                        intent="neutral"
                        priority="secondary"
                        tooltip={{ content: 'Manual' }}
                    />
                </Popover>
            </Row>
        </Row>
    );
};
