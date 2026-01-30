import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styled, { css } from 'styled-components';

import { IconButton, IconButtonProps, Spinner, Tooltip } from '@trezor/components';
import { borders, zIndices } from '@trezor/theme';

import type { SavingStatus } from './types';
import { SAVED_STATUS_TIMEOUT } from './utils';

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
    $isDirty: boolean;
    $savingStatus: SavingStatus;
}>`
    --base-transform: translateY(-50%);
    --base-gap: calc(0.1em + 2px);

    display: flex;
    align-items: center;
    gap: var(--base-gap);
    position: absolute;
    top: 50%;
    left: -6px;
    padding: var(--base-gap);
    padding-left: calc(100% + 6px + var(--base-gap) * 2);
    box-sizing: content-box;
    min-height: 28px;
    z-index: ${zIndices.labeling};
    background: ${({ theme }) => theme.baseFillElementNeutralSofter};
    border-radius: ${borders.radii.xs};
    transform: var(--base-transform) scaleX(0.95);
    transform-origin: left;
    opacity: 0;

    ${({ $isDirty }) =>
        !$isDirty &&
        css`
            transition: 0.2s ease-in-out;
        `}

    ${({ $isActive }) =>
        $isActive &&
        css`
            opacity: 1;
            transform: var(--base-transform);
        `}

    ${({ $savingStatus }) =>
        $savingStatus === 'saved' &&
        css`
            opacity: 0;
            transition: 300ms ${SAVED_STATUS_TIMEOUT - 300}ms opacity ease-in-out;
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
    const [isDirty, setIsDirty] = useState(false);

    const isActive = Boolean(isEditable || isHovered || savingStatus !== 'idle');

    useEffect(() => {
        if (!isActive) {
            setIsDirty(false);
        }
    }, [isActive]);

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
        if (isLoading || ['saving', 'saved'].includes(savingStatus)) {
            return (
                <Spinner
                    size={20}
                    margin={{ right: 4 }}
                    hasFinished={savingStatus === 'saved'}
                    isGrey={isLoading}
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
                            onClick={() => {
                                setIsDirty(true);
                                onEdit();
                            }}
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
                                intent="critical"
                                icon="trash"
                                onClick={() => {
                                    setIsDirty(true);
                                    onDelete();
                                }}
                                {...commonProps}
                            />
                        </Tooltip>
                    )}
                </>
            );
        }
    };

    return (
        <Container
            onClick={e => e.stopPropagation()}
            $isActive={isActive}
            $isDirty={isDirty}
            $savingStatus={savingStatus}
        >
            {getContent()}
        </Container>
    );
};
