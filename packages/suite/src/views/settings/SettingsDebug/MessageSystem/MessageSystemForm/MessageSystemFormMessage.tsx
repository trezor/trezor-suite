import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@suite/intl';
import {
    CATEGORY_OPTIONS,
    type ValidateError,
    getDefaultActionByCategory,
    messageSystemActions,
    selectMessageSystemConfig,
    stripFieldFromMessage,
    validateMessageForm,
} from '@suite-common/message-system';
import { type Action, type Category } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';
import { Column, Modal, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemJsonEditor } from './MessageSystemJsonEditor';
import { useConditionControls } from './useConditionControls';
import { MessageSystemManagerToolbar } from '../MessageSystemManager/MessageSystemManagerToolbar';

export const MessageSystemFormMessage = () => {
    const defaultAction = JSON.stringify(getDefaultActionByCategory('banner'), null, 2);
    const config = useSelector(selectMessageSystemConfig);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<string>(defaultAction);
    const [parsedData, setParsedData] = useState<Action | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidateError[]>([]);
    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const isValid = validationErrors.length === 0;

    const messageIds = useMemo(
        () => new Set(config?.actions.map(action => action.message.id)),
        [config],
    );

    useEffect(() => {
        try {
            const parsed = JSON.parse(formData);
            setParsedData(parsed);

            const validatedData = validateMessageForm(parsed);

            if (messageIds.has(validatedData.message.id)) {
                setValidationErrors([
                    {
                        field: 'message.id',
                        message: `must be unique. “${validatedData.message.id}” is already in use.`,
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
    }, [formData, messageIds, translationString]);

    const formatJSON = useCallback(() => {
        setFormData(JSON.stringify(parsedData, null, 2));
    }, [parsedData]);

    const handlePresetForm = useCallback((category: Category) => {
        setFormData(JSON.stringify(getDefaultActionByCategory(category), null, 2));
    }, []);

    const handleAddMessage = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addMessage(parsedData));
            setShowForm(false);
            setFormData(defaultAction);
        }
    };

    if (!showForm) {
        return (
            <Modal.Button
                onClick={() => setShowForm(true)}
                data-testid="@settings/debug/message-system/add-new-message-button"
            >
                Add new message
            </Modal.Button>
        );
    }

    return (
        <Column width="100%" gap={spacings.sm}>
            <MessageSystemManagerToolbar
                categories={CATEGORY_OPTIONS}
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
                <Modal.Button
                    isDisabled={!isValid}
                    onClick={handleAddMessage}
                    data-testid="@settings/debug/message-system/json-editor-add-message-button"
                >
                    Add message
                </Modal.Button>
                <Modal.Button
                    intent="neutral"
                    priority="secondary"
                    onClick={() => setShowForm(false)}
                >
                    Cancel
                </Modal.Button>
            </Row>
        </Column>
    );
};
