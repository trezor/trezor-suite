import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { selectAnalyticsInstanceId } from '@suite-common/analytics';
import {
    ExperimentsItemType,
    getActiveExperimentGroup,
    getInclusionFromInstanceId,
    messageSystemActions,
    selectAllManuallyAddedExperimentIds,
    selectAllValidExperiments,
} from '@suite-common/message-system';
import { Experiments } from '@suite-common/suite-types';
import { Banner, Button, Column, Divider, Modal } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemExperimentDetail } from './MessageSystemExperimentDetail';
import { MessageSystemExperimentInfo } from './MessageSystemExperimentInfo';
import { MessageSystemConditionGroup } from '../MessageSystemConditionGroup';
import { MessageSystemExperimentFilters } from './MessageSystemExperimentFilters';
import { MessageSystemFormExperiment } from '../MessageSystemForm/MessageSystemFormExperiment';

const MessageContainer = styled.div<{ $active: boolean }>`
    display: flex;
    gap: ${spacingsPx.sm};
    border-radius: ${borders.radii.sm};
    background-color: ${({ theme, $active }) =>
        $active
            ? theme.backgroundPrimarySubtleOnElevation0
            : theme.backgroundNeutralSubtleOnElevation0};
    padding: ${spacingsPx.sm};
`;

type MessageSystemManagerProps = {
    experiments: Experiments[];
    onCloseModal: () => void;
};

export const MessageSystemExperiments = ({
    experiments,
    onCloseModal,
}: MessageSystemManagerProps) => {
    const allValidExperiments = useSelector(selectAllValidExperiments);
    const allManuallyAddedExperimentIds = useSelector(selectAllManuallyAddedExperimentIds);
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const dispatch = useDispatch();

    const [showActive, setShowActive] = useState<boolean>(true);

    const removeExperiment = (id: string) => {
        dispatch(messageSystemActions.removeExperiment(id));
    };

    const validExperimentIdSet = useMemo(
        () => new Set(allValidExperiments.map(experiment => experiment.id)),
        [allValidExperiments],
    );

    const filteredExperiments = useMemo(() => {
        if (!showActive) return experiments;

        return experiments.filter(({ experiment }) => validExperimentIdSet.has(experiment.id));
    }, [experiments, showActive, validExperimentIdSet]);

    return (
        <Modal
            size="huge"
            onCancel={onCloseModal}
            heading={`Experiments (${allValidExperiments.length} active of ${experiments.length})`}
            bottomContent={<MessageSystemFormExperiment />}
        >
            <Column gap={spacings.sm}>
                <MessageSystemExperimentFilters
                    showActive={showActive}
                    onToggleActive={() => setShowActive(prev => !prev)}
                />
                {filteredExperiments.length === 0 && (
                    <Banner variant="warning">No experiments.</Banner>
                )}

                {filteredExperiments.map(({ experiment: rawExperiment, conditions }, index) => {
                    const experiment = rawExperiment as ExperimentsItemType;
                    const isActive = validExperimentIdSet.has(experiment.id);

                    const assignedGroup = getActiveExperimentGroup({ experiment, instanceId });
                    const inclusion = instanceId
                        ? getInclusionFromInstanceId(instanceId, experiment.id)
                        : null;

                    return (
                        <MessageContainer key={`${experiment.id}-${index}`} $active={isActive}>
                            <Column flex="1" gap={spacings.md}>
                                <MessageSystemExperimentDetail
                                    experiment={experiment}
                                    activeGroup={assignedGroup}
                                />

                                <Divider color="backgroundNeutralBold" />
                                <MessageSystemConditionGroup conditions={conditions} />
                            </Column>
                            <Column gap={spacings.xs}>
                                <MessageSystemExperimentInfo
                                    assignedGroup={assignedGroup}
                                    isActive={isActive}
                                    inclusion={inclusion}
                                />
                                <Column alignItems="flex-end" gap={spacings.xs}>
                                    <Button
                                        size="tiny"
                                        icon="copy"
                                        variant="primary"
                                        onClick={() =>
                                            copyToClipboard(
                                                JSON.stringify({ conditions, experiment }, null, 2),
                                            )
                                        }
                                    >
                                        Copy to clipboard
                                    </Button>
                                    {!!allManuallyAddedExperimentIds?.[experiment.id] && (
                                        <Button
                                            size="tiny"
                                            icon="trash"
                                            variant="destructive"
                                            onClick={() => removeExperiment(experiment.id)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Column>
                            </Column>
                        </MessageContainer>
                    );
                })}
            </Column>
        </Modal>
    );
};
