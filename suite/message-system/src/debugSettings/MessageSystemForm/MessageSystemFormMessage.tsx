import { useCallback, useState } from 'react';

import { useTranslation } from '@suite/intl';
import {
    CATEGORY_OPTIONS,
    messageSystemActions,
    useConditionControls,
    useMessageSystemMessageForm,
} from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { Column, Modal, Row } from '@trezor/components';

import { MessageSystemJsonEditor } from './MessageSystemJsonEditor';
import { MessageSystemManagerToolbar } from '../MessageSystemManager/MessageSystemManagerToolbar';

export const MessageSystemFormMessage = () => {
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
    } = useMessageSystemMessageForm({ formatFieldError });

    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );

    const handleAddMessage = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addMessage(parsedData));
            setShowForm(false);
            resetForm();
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
        <Column width="100%" gap={12}>
            <MessageSystemManagerToolbar
                categories={CATEGORY_OPTIONS}
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

            <Row isReversed gap={8}>
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
