import { useMemo, useState } from 'react';

import styled from 'styled-components';

import {
    messageSystemActions,
    selectAllManuallyAddedMessageIds,
    selectAllValidMessages,
} from '@suite-common/message-system';
import { Action } from '@suite-common/suite-types';
import {
    Banner,
    BannerVariant,
    Button,
    Column,
    Divider,
    Modal,
    useElevation,
} from '@trezor/components';
import { mapVariantToBackgroundColor } from '@trezor/components/src/components/Banner/utils';
import { copyToClipboard } from '@trezor/dom-utils';
import { Elevation, borders, spacings, spacingsPx } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { MessageSystemManagerConditionGroup } from './MessageSystemManagerConditionGroup';
import { MessageSystemManagerDetail } from './MessageSystemManagerDetail';
import { CategoryFilterOption, MessageSystemManagerFilters } from './MessageSystemManagerFilters';
import { MessageSystemManagerInfo } from './MessageSystemManagerInfo';
import { MessageSystemForm } from '../MessageSystemForm/MessageSystemForm';

const MessageContainer = styled.div<{ $variant: BannerVariant; $elevation: Elevation }>`
    display: flex;
    gap: ${spacingsPx.sm};
    background: ${mapVariantToBackgroundColor};
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.sm};
`;

type MessageSystemManagerProps = {
    actions: Action[];
    onCloseModal: () => void;
};

export const MessageSystemManager = ({ actions, onCloseModal }: MessageSystemManagerProps) => {
    const allValidMessages = useSelector(selectAllValidMessages);
    const allManuallyAddedMessageIds = useSelector(selectAllManuallyAddedMessageIds);
    const { elevation } = useElevation();
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
            size="huge"
            onCancel={onCloseModal}
            heading={`Messages (${allValidMessages.length} active of ${actions.length})`}
            bottomContent={<MessageSystemForm />}
        >
            <Column gap={spacings.sm}>
                <MessageSystemManagerFilters
                    showActive={showActive}
                    onToggleActive={() => setIsActive(prev => !prev)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
                {filteredActions.length === 0 && <Banner variant="warning">No messages.</Banner>}

                {filteredActions.map(({ message, conditions }, index) => (
                    <MessageContainer
                        key={`${message.id}-${index}`}
                        $variant={message.variant === 'critical' ? 'destructive' : message.variant}
                        $elevation={elevation}
                    >
                        <Column flex="1" gap={spacings.md}>
                            <MessageSystemManagerDetail message={message} />
                            <Divider color="backgroundNeutralBold" />
                            <MessageSystemManagerConditionGroup conditions={conditions} />
                        </Column>
                        <Column gap={spacings.xs}>
                            <MessageSystemManagerInfo
                                message={message}
                                allValidMessages={allValidMessages}
                                isInApp={!!allManuallyAddedMessageIds?.[message.id]}
                            />
                            <Column alignItems="flex-end" gap={spacings.xs}>
                                <Button
                                    size="tiny"
                                    icon="copy"
                                    variant="primary"
                                    onClick={() =>
                                        copyToClipboard(
                                            JSON.stringify({ conditions, message }, null, 2),
                                        )
                                    }
                                >
                                    Copy to clipboard
                                </Button>
                                {!!allManuallyAddedMessageIds?.[message.id] && (
                                    <Button
                                        size="tiny"
                                        icon="trash"
                                        variant="destructive"
                                        onClick={() => removeMessage(message.id)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Column>
                        </Column>
                    </MessageContainer>
                ))}
            </Column>
        </Modal>
    );
};
