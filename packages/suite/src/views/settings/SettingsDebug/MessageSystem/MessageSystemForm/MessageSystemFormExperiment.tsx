import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@suite/intl';
import {
    type ValidateError,
    getDefaultExperiment,
    messageSystemActions,
    selectMessageSystemConfig,
    stripFieldFromMessage,
    validateExperimentForm,
} from '@suite-common/message-system';
import { type Experiments } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';
import { Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemJsonEditor } from './MessageSystemJsonEditor';
import { useConditionControls } from './useConditionControls';
import { MessageSystemExperimentToolbar } from '../MessageSystemExperiment/MessageSystemExperimentToolbar';

export const MessageSystemFormExperiment = () => {
    const defaultAction = JSON.stringify(getDefaultExperiment(), null, 2);
    const config = useSelector(selectMessageSystemConfig);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<string>(defaultAction);
    const [parsedData, setParsedData] = useState<Experiments | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidateError[]>([]);
    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const isValid = validationErrors.length === 0;

    const experimentIds = useMemo(
        () => new Set(config?.experiments?.map(experiment => experiment.experiment.id)),
        [config],
    );

    useEffect(() => {
        try {
            const parsed = JSON.parse(formData);
            setParsedData(parsed);

            const validatedData = validateExperimentForm(parsed);

            if (experimentIds.has(validatedData.experiment.id)) {
                setValidationErrors([
                    {
                        field: 'experiment.id',
                        message: `must be unique. “${validatedData.experiment.id}” is already in use.`,
                    },
                ]);
            } else {
                setValidationErrors([]);
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                const { message } = error;
                setParsedData(null);
                setValidationErrors([{ field: 'JSON', message }]);

                return;
            }

            if (error instanceof yup.ValidationError) {
                const errors = (error.inner?.length ? error.inner : [error]).map(e => ({
                    field: e.path ?? 'value',
                    message:
                        e.message === 'TR_REQUIRED_FIELD'
                            ? translationString(e.message)
                            : e.message,
                }));

                setValidationErrors(stripFieldFromMessage(errors));

                return;
            }

            setParsedData(null);
            setValidationErrors([{ field: 'JSON', message: 'Unknown error occurred' }]);
        }
    }, [formData, experimentIds, translationString]);

    const formatJSON = useCallback(() => {
        setFormData(JSON.stringify(parsedData, null, 2));
    }, [parsedData]);

    const handlePresetForm = useCallback(() => {
        setFormData(JSON.stringify(getDefaultExperiment(), null, 2));
    }, []);

    const handleAddExperiment = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addExperiment(parsedData));
            setShowForm(false);
            setFormData(defaultAction);
        }
    };

    if (!showForm) {
        return (
            <Button size="small" onClick={() => setShowForm(true)}>
                Add new experiment
            </Button>
        );
    }

    return (
        <Column width="100%" gap={spacings.sm}>
            <MessageSystemExperimentToolbar
                availableConditions={availableConditionOptions}
                canAddCondition={canAddCondition}
                onPreset={handlePresetForm}
                onAddCondition={addCondition}
            />

            <MessageSystemJsonEditor
                value={formData}
                isValid={isValid}
                canFormat={parsedData !== null}
                errors={validationErrors}
                onChange={setFormData}
                onFormat={formatJSON}
            />

            <Row isReversed gap={spacings.xs}>
                <Button isDisabled={!isValid} onClick={handleAddExperiment} size="small">
                    Add experiment
                </Button>
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={() => setShowForm(false)}
                >
                    Cancel
                </Button>
            </Row>
        </Column>
    );
};
