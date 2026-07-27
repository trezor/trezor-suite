import { useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    CATEGORY_OPTIONS,
    messageSystemActions,
    useConditionControls,
    useMessageSystemMessageForm,
} from '@suite-common/message-system';
import { type Category, type Condition } from '@suite-common/suite-types';
import { Button, Input, Select, Text, VStack } from '@suite-native/atoms';

export const MessageSystemAddMessageForm = () => {
    const dispatch = useDispatch();
    const [presetCategory, setPresetCategory] = useState<Category>('banner');

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
    } = useMessageSystemMessageForm();

    const { availableConditionOptions, canAddCondition, addCondition } = useConditionControls(
        parsedData,
        setFormData,
    );

    const handlePreset = (category: Category) => {
        setPresetCategory(category);
        applyPreset(category);
    };

    const handleAddCondition = (conditionKey: keyof Condition | '') => {
        if (conditionKey === '') {
            return;
        }
        addCondition(conditionKey);
    };

    const handleAddMessage = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addMessage(parsedData));
            setPresetCategory('banner');
            resetForm();
        }
    };

    return (
        <VStack spacing="sp12">
            <Text variant="body-md-strong">Add new message</Text>
            <Select<Category>
                title="Preset"
                items={[...CATEGORY_OPTIONS]}
                value={presetCategory}
                onSelectItem={handlePreset}
                isLabelShown
            />
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
                label="Message JSON"
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
            <Button size="medium" isDisabled={!isValid} onPress={handleAddMessage}>
                Add message
            </Button>
        </VStack>
    );
};
