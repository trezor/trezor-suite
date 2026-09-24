import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import {
    EXPERIMENT_MAP,
    getDefaultExperiment,
    messageSystemActions,
    selectMessageSystemConfig,
    validateExperimentForm,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { type Experiments } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';
import { Button, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';

type ExperimentFormValues = {
    experimentJson: string;
};

const experimentOptions = Object.entries(EXPERIMENT_MAP)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ label: name, value: id }));

const getDefaultMobileExperiment = (): Experiments => ({
    ...getDefaultExperiment(),
    conditions: [{ environment: { desktop: '!', mobile: '*', web: '!' } }],
});

const stringifyExperiment = (experiment: Experiments) => JSON.stringify(experiment, null, 2);

const parseExperiment = (experimentJson: string): Experiments => {
    const experiment: Experiments = JSON.parse(experimentJson);
    validateExperimentForm(experiment);

    return experiment;
};

const parseExperimentOrNull = (experimentJson: string) => {
    try {
        return parseExperiment(experimentJson);
    } catch {
        return null;
    }
};

const getExperimentFormValidation = (experimentIds: Set<string>) =>
    yup.object({
        experimentJson: yup
            .string()
            .required()
            .test('experiment', (value, context) => {
                try {
                    const { experiment } = parseExperiment(value);

                    return experimentIds.has(experiment.id)
                        ? context.createError({
                              message: `experiment.id must be unique. “${experiment.id}” is already in use.`,
                          })
                        : true;
                } catch (error) {
                    return context.createError({
                        message:
                            error instanceof yup.ValidationError
                                ? error.errors.join('\n')
                                : String(error),
                    });
                }
            }),
    });

export const MessageSystemAddExperimentForm = () => {
    const config = useSelector(selectMessageSystemConfig);
    const [isFormShown, setIsFormShown] = useState(false);
    const { dispatch } = useServices(injectDispatch);

    const experimentIds = new Set(config?.experiments?.map(({ experiment }) => experiment.id));
    const form = useForm<ExperimentFormValues>({
        mode: 'onChange',
        defaultValues: {
            experimentJson: stringifyExperiment(getDefaultMobileExperiment()),
        },
        validation: getExperimentFormValidation(experimentIds),
    });

    const experimentJson = useWatch({ control: form.control, name: 'experimentJson' });
    const currentExperiment = parseExperimentOrNull(experimentJson);

    const handleSelectExperiment = (id: string) => {
        const baseExperiment = currentExperiment ?? getDefaultMobileExperiment();

        form.setValue(
            'experimentJson',
            stringifyExperiment({
                ...baseExperiment,
                experiment: { ...baseExperiment.experiment, id },
            }),
            { shouldValidate: true },
        );
    };

    const handleAddExperiment = form.handleSubmit(values => {
        dispatch(messageSystemActions.addExperiment(JSON.parse(values.experimentJson)));
        setIsFormShown(false);
        form.reset({ experimentJson: stringifyExperiment(getDefaultMobileExperiment()) });
    });

    if (!isFormShown) {
        return (
            <Button size="medium" onPress={() => setIsFormShown(true)}>
                Add new experiment
            </Button>
        );
    }

    return (
        <Form form={form}>
            <VStack spacing="sp12">
                <Text variant="body-md-strong">Add new experiment</Text>
                <Select<string>
                    title="Experiment"
                    items={experimentOptions}
                    value={currentExperiment?.experiment.id ?? ''}
                    onSelectItem={handleSelectExperiment}
                    isLabelShown
                />
                <TextInputField
                    name="experimentJson"
                    label="Experiment JSON"
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <HStack spacing="sp8">
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        onPress={() => setIsFormShown(false)}
                        flex={1}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="medium"
                        isDisabled={!form.formState.isValid}
                        onPress={handleAddExperiment}
                        flex={1}
                    >
                        Add experiment
                    </Button>
                </HStack>
            </VStack>
        </Form>
    );
};
