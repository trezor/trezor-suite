import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useTranslation } from '@suite/intl';
import {
    messageSystemActions,
    useConditionControls,
    useMessageSystemExperimentForm,
} from '@suite-common/message-system';
import { Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { MessageSystemJsonEditor } from './MessageSystemJsonEditor';
import { MessageSystemExperimentToolbar } from '../MessageSystemExperiment/MessageSystemExperimentToolbar';

export const MessageSystemFormExperiment = () => {
    const [showForm, setShowForm] = useState(false);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const formatFieldError = useCallback(
        (message: string) =>
            message === 'TR_REQUIRED_FIELD' ? translationString(message) : message,
        [translationString],
    );

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
    } = useMessageSystemExperimentForm({ formatFieldError });

    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );

    const handleAddExperiment = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addExperiment(parsedData));
            setShowForm(false);
            resetForm();
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
                onPreset={applyPreset}
                onAddCondition={addCondition}
            />

            <MessageSystemJsonEditor
                value={formData}
                isValid={isValid}
                canFormat={canFormat}
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
