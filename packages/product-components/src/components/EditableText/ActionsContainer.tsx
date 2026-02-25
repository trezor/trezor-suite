import React from 'react';
import { FormattedMessage } from 'react-intl';

import styled, { css } from 'styled-components';

import { IconButton, IconButtonProps, Spinner, Tooltip } from '@trezor/components';

import type { SavingStatus } from './types';

type ActionContainerProps = {
    onEdit: () => void;
    onDelete: () => void | Promise<void>;
    onSubmit: () => void | Promise<void>;
    onError: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    isEditable: boolean;
    isDisabled?: boolean;
    isHovered: boolean;
    isDeleteButtonVisible: boolean;
    isSubmitButtonVisible: boolean;
    savingStatus: SavingStatus;
};

const Container = styled.div<{
    $isActive: boolean;
}>`
    display: flex;
    align-items: center;
    gap: calc(0.1em + 2px);
    transform-origin: left;
    transform: translateX(-5px);
    opacity: 0;
    pointer-events: none;

    ${({ $isActive }) =>
        $isActive &&
        css`
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
            transition: 200ms ease-in-out;
        `}
`;

export const ActionsContainer = ({
    onEdit,
    onDelete,
    onSubmit,
    onError,
    onCancel,
    isLoading,
    isEditable,
    isDisabled,
    isHovered,
    isDeleteButtonVisible,
    isSubmitButtonVisible,
    savingStatus,
}: ActionContainerProps) => {
    const isActive = Boolean(isEditable || isHovered);

    if (isDisabled) {
        return null;
    }

    const commonProps: Partial<IconButtonProps> = {
        isDisabled,
        tabIndex: isActive ? 0 : -1,
        priority: 'secondary',
        size: 'small',
    };

    const getContent = () => {
        if (isLoading || ['saved', 'saving'].includes(savingStatus)) {
            return (
                <Spinner
                    size={20}
                    margin={{ horizontal: 4 }}
                    variant={savingStatus === 'saved' ? 'success' : 'loading'}
                    isDisabled={isLoading}
                    data-testid={savingStatus === 'saved' ? `@metadata/success` : undefined}
                />
            );
        }

        if (savingStatus === 'error') {
            return (
                <Tooltip
                    content={
                        <FormattedMessage
                            id="TR_LABELING_ERROR"
                            defaultMessage="There was an error saving the label. Please try again."
                        />
                    }
                    delayShow={0}
                >
                    <IconButton
                        intent="critical"
                        icon="arrowsClockwise"
                        onClick={onError}
                        {...commonProps}
                    />
                </Tooltip>
            );
        }

        if (isEditable) {
            return (
                <>
                    {isSubmitButtonVisible && (
                        <IconButton
                            data-testid="@metadata/submit"
                            icon="check"
                            onClick={onSubmit}
                            {...commonProps}
                        />
                    )}
                    <IconButton
                        data-testid="@metadata/cancel"
                        icon="x"
                        intent="neutral"
                        onClick={onCancel}
                        {...commonProps}
                    />
                </>
            );
        } else {
            return (
                <>
                    <Tooltip
                        content={
                            <FormattedMessage id="TR_LABELING_EDIT_LABEL" defaultMessage="Edit" />
                        }
                        delayShow={1000}
                    >
                        <IconButton
                            data-testid="@metadata/edit"
                            intent="neutral"
                            icon="pencilSimple"
                            onClick={onEdit}
                            {...commonProps}
                        />
                    </Tooltip>
                    {isDeleteButtonVisible && (
                        <Tooltip
                            content={
                                <FormattedMessage
                                    id="TR_LABELING_REMOVE_LABEL"
                                    defaultMessage="Remove"
                                />
                            }
                            delayShow={1000}
                        >
                            <IconButton
                                data-testid="@metadata/delete"
                                intent="critical"
                                icon="trash"
                                onClick={onDelete}
                                {...commonProps}
                            />
                        </Tooltip>
                    )}
                </>
            );
        }
    };

    return (
        <Container onClick={e => e.stopPropagation()} $isActive={isActive}>
            {getContent()}
        </Container>
    );
};
