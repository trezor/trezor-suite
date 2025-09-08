import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    CATEGORY_OPTIONS,
    CONDITION_OPTIONS,
    ValidateError,
    getDefaultActionByCategory,
    getDefaultConditionValue,
    messageSystemActions,
    selectMessageSystemConfig,
    stripFieldFromMessage,
    validateMessageForm,
} from '@suite-common/message-system';
import { Action, Category, Condition } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';
import { Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

import { MessageSystemInfoButtons } from './MessageSystemInfoButtons';
import { MessageSystemJsonEditor } from './MessageSystemJsonEditor';
import { MessageSystemPresetControls } from './MessageSystemPresetControls';

export const MessageSystemForm = () => {
    const defaultAction = JSON.stringify(getDefaultActionByCategory('banner'), null, 2);
    const config = useSelector(selectMessageSystemConfig);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<string>(defaultAction);
    const [parsedData, setParsedData] = useState<Action | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidateError[]>([]);
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

    const availableConditionOptions = useMemo(() => {
        if (!Array.isArray(parsedData?.conditions) || !parsedData.conditions[0]) {
            return CONDITION_OPTIONS;
        }

        const conditions = parsedData.conditions[0] as Record<keyof Condition, unknown>;
        const used = new Set(Object.keys(conditions));

        return CONDITION_OPTIONS.filter(option => !used.has(option.value));
    }, [parsedData]);

    const handlePresetForm = useCallback((category: Category) => {
        setFormData(JSON.stringify(getDefaultActionByCategory(category), null, 2));
    }, []);

    const handleAddCondition = (conditionKey: keyof Condition) => {
        if (!parsedData) return;

        const defaultValue = getDefaultConditionValue(conditionKey);

        const existing = Array.isArray(parsedData.conditions) ? parsedData.conditions : [];

        const head = (existing[0] ?? {}) as Record<string, unknown>;

        if (Object.prototype.hasOwnProperty.call(head, conditionKey)) {
            return;
        }

        const updatedHead = { ...head, [conditionKey]: defaultValue };

        const next = {
            ...parsedData,
            conditions: [updatedHead, ...existing.slice(1)],
        };

        setFormData(JSON.stringify(next, null, 2));
    };

    const handleAddMessage = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addMessage(parsedData));
            setShowForm(false);
            setFormData(defaultAction);
        }
    };

    if (!showForm) {
        return (
            <Button size="small" onClick={() => setShowForm(true)}>
                Add new message
            </Button>
        );
    }

    return (
        <Column width="100%" gap={spacings.sm}>
            <Row justifyContent="space-between" alignItems="center">
                <MessageSystemPresetControls
                    categories={CATEGORY_OPTIONS}
                    availableConditions={availableConditionOptions}
                    canAddCondition={!!parsedData && availableConditionOptions.length > 0}
                    onPreset={handlePresetForm}
                    onAddCondition={handleAddCondition}
                />
                <MessageSystemInfoButtons />
            </Row>

            <MessageSystemJsonEditor
                value={formData}
                isValid={isValid}
                canFormat={parsedData !== null}
                errors={validationErrors}
                onChange={setFormData}
                onFormat={formatJSON}
            />

            <Row isReversed gap={spacings.xs}>
                <Button isDisabled={!isValid} onClick={handleAddMessage} size="small">
                    Add message
                </Button>
                <Button size="small" variant="tertiary" onClick={() => setShowForm(false)}>
                    Cancel
                </Button>
            </Row>
        </Column>
    );
};
