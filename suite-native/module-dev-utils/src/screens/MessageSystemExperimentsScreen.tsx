import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import {
    messageSystemActions,
    selectAllExperimentInclusionOverrides,
    selectAllManuallyAddedExperimentIds,
    selectAllValidExperiments,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { Box, CheckBox, Divider, Text, VStack } from '@suite-native/atoms';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { MessageSystemAddExperimentForm } from '../components/MessageSystemAddExperimentForm';
import { MessageSystemExperimentItem } from '../components/MessageSystemExperimentItem';

export const MessageSystemExperimentsScreen = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidExperiments = useSelector(selectAllValidExperiments);
    const allManuallyAddedExperimentIds = useSelector(selectAllManuallyAddedExperimentIds);
    const allExperimentInclusionOverrides = useSelector(selectAllExperimentInclusionOverrides);
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const dispatch = useDispatch();

    const [showActive, setShowActive] = useState<boolean>(true);

    const validExperimentIdSet = useMemo(
        () => new Set(allValidExperiments.map(experiment => experiment.id)),
        [allValidExperiments],
    );

    const filteredExperiments = useMemo(() => {
        const experiments = config?.experiments ?? [];
        if (!showActive) {
            return experiments;
        }

        return experiments.filter(({ experiment }) => validExperimentIdSet.has(experiment.id));
    }, [config, showActive, validExperimentIdSet]);

    const handleRemove = (id: string) => {
        dispatch(messageSystemActions.removeExperiment(id));
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title="Experiments"
                    subtitle={`${allValidExperiments.length} active of ${config?.experiments?.length ?? 0}`}
                />
            }
        >
            <VStack spacing="sp16">
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text>Show only active</Text>
                    <CheckBox
                        isChecked={showActive}
                        onChange={() => setShowActive(prev => !prev)}
                    />
                </Box>
                {filteredExperiments.length === 0 && <Text variant="body-sm">No experiments.</Text>}
                {filteredExperiments.map((experimentsItem, index) => (
                    <MessageSystemExperimentItem
                        key={`${experimentsItem.experiment.id}-${index}`}
                        experimentsItem={experimentsItem}
                        isActive={validExperimentIdSet.has(experimentsItem.experiment.id)}
                        isManuallyAdded={
                            !!allManuallyAddedExperimentIds?.[experimentsItem.experiment.id]
                        }
                        instanceId={instanceId}
                        inclusionOverride={
                            allExperimentInclusionOverrides?.[experimentsItem.experiment.id]
                        }
                        onRemove={handleRemove}
                    />
                ))}
                <Divider />
                <MessageSystemAddExperimentForm />
            </VStack>
        </Screen>
    );
};
