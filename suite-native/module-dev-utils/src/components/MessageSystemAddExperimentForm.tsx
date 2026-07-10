import { useDispatch } from 'react-redux';

import {
    messageSystemActions,
    useConditionControls,
    useMessageSystemExperimentForm,
} from '@suite-common/message-system';
import { type Condition } from '@suite-common/suite-types';
import { Button, Input, Select, Text, VStack } from '@suite-native/atoms';

export const MessageSystemAddExperimentForm = () => {
    const dispatch = useDispatch();

    const {
        formData,
        setFormData,
        parsedData,
        validationErrors,
        isValid,
        canFormat,
        formatJSON,
        applyPreset,
        resetForm,
    } = useMessageSystemExperimentForm();

    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );

    const handleAddCondition = (conditionKey: keyof Condition | '') => {
        if (conditionKey === '') {
            return;
        }
        addCondition(conditionKey);
    };

    const handleAddExperiment = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addExperiment(parsedData));
            resetForm();
        }
    };

    return (
        <VStack spacing="sp12">
            <Text variant="body-md-strong">Add new experiment</Text>
            <Button intent="neutral" priority="secondary" size="medium" onPress={applyPreset}>
                Default experiment
            </Button>
            {canAddCondition && (
                <Select<keyof Condition | ''>
                    title="Add condition"
                    items={[...availableConditionOptions]}
                    value=""
                    onSelectItem={handleAddCondition}
                    isLabelShown
                />
            )}
            <Input
                label="Experiment JSON"
                value={formData}
                onChangeText={setFormData}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                hasError={!isValid}
            />
            {isValid ? (
                <Text variant="body-sm">Config is valid</Text>
            ) : (
                validationErrors.map((error, index) => (
                    <Text key={`${error.field}-${index}`} variant="body-sm" color="contentCritical">
                        {error.field} {error.message}
                    </Text>
                ))
            )}
            <Button
                intent="neutral"
                priority="secondary"
                size="medium"
                isDisabled={!canFormat}
                onPress={formatJSON}
            >
                Format JSON
            </Button>
            <Button size="medium" isDisabled={!isValid} onPress={handleAddExperiment}>
                Add experiment
            </Button>
        </VStack>
    );
};
