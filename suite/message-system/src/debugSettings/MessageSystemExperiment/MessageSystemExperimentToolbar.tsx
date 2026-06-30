import { Fragment, useRef } from 'react';

import styled from 'styled-components';

import { EXPERIMENT_MAP } from '@suite-common/message-system';
import { type Condition } from '@suite-common/suite-types';
import {
    Button,
    Card,
    Grid,
    IconButton,
    Menu,
    Popover,
    type PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { CodeBlockFilledIcon, PlusIcon, QuestionIcon } from '@trezor/icons';
import { spacings, zIndices } from '@trezor/theme';

import { MessageSystemManual } from '../MessageSystemManual';

const ScrollContainer = styled.div`
    overflow-y: auto;
    max-height: 90vh;
`;

type MessageSystemExperimentToolbarProps = {
    availableConditions: ReadonlyArray<{ value: keyof Condition; label: string }>;
    canAddCondition: boolean;
    onPreset: () => void;
    onAddCondition: (key: keyof Condition) => void;
};

export const MessageSystemExperimentToolbar = ({
    availableConditions,
    canAddCondition,
    onPreset,
    onAddCondition,
}: MessageSystemExperimentToolbarProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    return (
        <Row justifyContent="space-between" alignItems="center">
            <Row alignItems="center" gap={spacings.xs}>
                <Text>Preset:</Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={() => onPreset()}
                >
                    Default experiment
                </Button>

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
            <Row gap={spacings.xs}>
                <Popover
                    content={
                        <Card>
                            <Grid columns="repeat(2, max-content)" rowGap={4} columnGap={16}>
                                {Object.entries(EXPERIMENT_MAP)
                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                    .map(([key, name]) => (
                                        <Fragment key={key}>
                                            <strong>{name}</strong>
                                            <span>{key}</span>
                                        </Fragment>
                                    ))}
                            </Grid>
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
                        Experiment map
                    </Button>
                </Popover>

                <Popover
                    content={
                        <Card>
                            <ScrollContainer>
                                <MessageSystemManual include={['experimental', 'conditions']} />
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
