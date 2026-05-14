import { useMemo, useState } from 'react';

import {
    messageSystemActions,
    selectAllManuallyAddedMessageIds,
    selectAllValidMessages,
} from '@suite-common/message-system';
import { type Action } from '@suite-common/suite-types';
import { Banner, Button, Column, Divider, Modal, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemConditionGroup } from '../MessageSystemConditionGroup';
import { MessageSystemManagerDetail } from './MessageSystemManagerDetail';
import {
    type CategoryFilterOption,
    MessageSystemManagerFilters,
} from './MessageSystemManagerFilters';
import { MessageSystemManagerInfo } from './MessageSystemManagerInfo';
import { MessageSystemFormMessage } from '../MessageSystemForm/MessageSystemFormMessage';

type MessageSystemManagerProps = {
    actions: Action[];
    onCloseModal: () => void;
};

export const MessageSystemManager = ({ actions, onCloseModal }: MessageSystemManagerProps) => {
    const allValidMessages = useSelector(selectAllValidMessages);
    const allManuallyAddedMessageIds = useSelector(selectAllManuallyAddedMessageIds);
    const dispatch = useDispatch();

    const [showActive, setIsActive] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('all');

    const removeMessage = (id: string) => {
        dispatch(messageSystemActions.removeMessage(id));
    };

    const validMessageIdSet = useMemo(
        () => new Set(allValidMessages.map(message => message.id)),
        [allValidMessages],
    );

    const filteredActions = useMemo(() => {
        const isAllCategories = selectedCategory === 'all';

        return actions.filter(({ message }) => {
            const passesActiveFilter = !showActive || validMessageIdSet.has(message.id);

            const categories = Array.isArray(message.category)
                ? message.category
                : [message.category];

            const passesCategoryFilter = isAllCategories
                ? true
                : categories.includes(selectedCategory);

            return passesActiveFilter && passesCategoryFilter;
        });
    }, [actions, showActive, validMessageIdSet, selectedCategory]);

    return (
        <Modal
            width={960}
            onCancel={onCloseModal}
            heading={`Messages (${allValidMessages.length} active of ${actions.length})`}
            bottomContent={<MessageSystemFormMessage />}
            isBackdropCancelable={false}
        >
            <Column gap={spacings.sm}>
                <MessageSystemManagerFilters
                    showActive={showActive}
                    onToggleActive={() => setIsActive(prev => !prev)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
                {filteredActions.length === 0 && (
                    <Banner intent="warning" description="No messages." />
                )}

                {filteredActions.map(({ message, conditions }, index) => (
                    <Banner
                        key={`${message.id}-${index}`}
                        intent={message.variant}
                        description={
                            <Text as="div" intent="neutral">
                                <Row gap={24} alignItems="flex-start">
                                    <Column flex="1" gap={spacings.md}>
                                        <MessageSystemManagerDetail message={message} />
                                        <Divider color="legacyBackgroundNeutralBold" />
                                        <MessageSystemConditionGroup conditions={conditions} />
                                    </Column>
                                    <Column gap={spacings.xs}>
                                        <MessageSystemManagerInfo
                                            message={message}
                                            allValidMessages={allValidMessages}
                                            isInApp={!!allManuallyAddedMessageIds?.[message.id]}
                                        />
                                        <Column alignItems="flex-end" gap={spacings.xs}>
                                            <Button
                                                size="small"
                                                iconLeft="copy"
                                                intent="neutral"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        JSON.stringify(
                                                            { conditions, message },
                                                            null,
                                                            2,
                                                        ),
                                                    )
                                                }
                                            >
                                                Copy to clipboard
                                            </Button>
                                            {!!allManuallyAddedMessageIds?.[message.id] && (
                                                <Button
                                                    size="small"
                                                    iconLeft="trash"
                                                    intent="critical"
                                                    onClick={() => removeMessage(message.id)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Column>
                                    </Column>
                                </Row>
                            </Text>
                        }
                    />
                ))}
            </Column>
        </Modal>
    );
};
