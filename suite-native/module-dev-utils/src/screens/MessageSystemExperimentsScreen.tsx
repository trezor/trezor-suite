import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    selectAllConfigExperiments,
    selectAllManuallyAddedExperimentIds,
    selectAllValidConfigExperiments,
} from '@suite-common/message-system';
import { Box, CheckBox, Divider, Text, VStack } from '@suite-native/atoms';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { MessageSystemAddExperimentForm } from '../components/MessageSystemAddExperimentForm';
import { MessageSystemExperimentItem } from '../components/MessageSystemExperimentItem';

export const MessageSystemExperimentsScreen = () => {
    const allExperiments = useSelector(selectAllConfigExperiments);
    const validExperiments = useSelector(selectAllValidConfigExperiments);
    const allManuallyAddedExperimentIds = useSelector(selectAllManuallyAddedExperimentIds);

    const [isActiveOnlyShown, setIsActiveOnlyShown] = useState(true);

    const shownExperiments = isActiveOnlyShown ? validExperiments : allExperiments;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title="Experiments"
                    subtitle={`${validExperiments.length} active of ${allExperiments.length}`}
                />
            }
        >
            <VStack spacing="sp16">
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text>Show only active</Text>
                    <CheckBox
                        isChecked={isActiveOnlyShown}
                        onChange={() => setIsActiveOnlyShown(prev => !prev)}
                    />
                </Box>
                {shownExperiments.length === 0 && <Text variant="body-sm">No experiments.</Text>}
                {shownExperiments.map((experimentWithConditions, index) => (
                    <MessageSystemExperimentItem
                        key={`${experimentWithConditions.experiment.id}-${index}`}
                        experimentWithConditions={experimentWithConditions}
                        isManuallyAdded={
                            !!allManuallyAddedExperimentIds?.[
                                experimentWithConditions.experiment.id
                            ]
                        }
                    />
                ))}
                <Divider />
                <MessageSystemAddExperimentForm />
            </VStack>
        </Screen>
    );
};
