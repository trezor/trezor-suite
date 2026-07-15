import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    messageSystemActions,
    selectAllManuallyAddedMessageIds,
    selectAllValidMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { Divider, Text, VStack } from '@suite-native/atoms';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { MessageSystemAddMessageForm } from '../components/MessageSystemAddMessageForm';
import {
    type CategoryFilterOption,
    MessageSystemManagerFilters,
} from '../components/MessageSystemManagerFilters';
import { MessageSystemMessageItem } from '../components/MessageSystemMessageItem';

export const MessageSystemManagerScreen = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidMessages = useSelector(selectAllValidMessages);
    const allManuallyAddedMessageIds = useSelector(selectAllManuallyAddedMessageIds);
    const dispatch = useDispatch();

    const [showActive, setShowActive] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('all');

    const validMessageIdSet = useMemo(
        () => new Set(allValidMessages.map(message => message.id)),
        [allValidMessages],
    );

    const filteredActions = useMemo(() => {
        const isAllCategories = selectedCategory === 'all';

        return (config?.actions ?? []).filter(({ message }) => {
            const passesActiveFilter = !showActive || validMessageIdSet.has(message.id);

            const categories = Array.isArray(message.category)
                ? message.category
                : [message.category];

            const passesCategoryFilter = isAllCategories
                ? true
                : categories.includes(selectedCategory);

            return passesActiveFilter && passesCategoryFilter;
        });
    }, [config, showActive, validMessageIdSet, selectedCategory]);

    const handleRemove = (id: string) => {
        dispatch(messageSystemActions.removeMessage(id));
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title="Message system manager"
                    subtitle={`${allValidMessages.length} active of ${config?.actions.length ?? 0}`}
                />
            }
        >
            <VStack spacing="sp16">
                <MessageSystemManagerFilters
                    showActive={showActive}
                    onToggleActive={() => setShowActive(prev => !prev)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
                {filteredActions.length === 0 && <Text variant="body-sm">No messages.</Text>}
                {filteredActions.map((action, index) => (
                    <MessageSystemMessageItem
                        key={`${action.message.id}-${index}`}
                        action={action}
                        isActive={validMessageIdSet.has(action.message.id)}
                        isManuallyAdded={!!allManuallyAddedMessageIds?.[action.message.id]}
                        onRemove={handleRemove}
                    />
                ))}
                <Divider />
                <MessageSystemAddMessageForm />
            </VStack>
        </Screen>
    );
};
