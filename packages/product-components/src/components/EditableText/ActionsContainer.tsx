import { FormattedMessage } from 'react-intl';

import styled, { css } from 'styled-components';

import { IconButton, type IconButtonProps, Spinner } from '@trezor/components';
import { ArrowsClockwiseIcon, CheckIcon, PencilSimpleIcon, TrashIcon, XIcon } from '@trezor/icons';

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
    /* stylelint-disable-next-line trezor/dimension-token-values -- Keep spacing relative to the text size. */
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
                <IconButton
                    intent="critical"
                    icon={ArrowsClockwiseIcon}
                    onClick={onError}
                    tooltip={{
                        content: (
                            <FormattedMessage
                                id="TR_LABELING_ERROR"
                                defaultMessage="There was an error saving the label. Please try again."
                            />
                        ),
                        delayShow: 0,
                    }}
                    {...commonProps}
                />
            );
        }

        if (isEditable) {
            return (
                <>
                    {isSubmitButtonVisible && (
                        <IconButton
                            data-testid="@metadata/submit"
                            icon={CheckIcon}
                            onClick={onSubmit}
                            tooltip={{ isActive: false }}
                            {...commonProps}
                        />
                    )}
                    <IconButton
                        data-testid="@metadata/cancel"
                        icon={XIcon}
                        intent="neutral"
                        onClick={onCancel}
                        tooltip={{ isActive: false }}
                        {...commonProps}
                    />
                </>
            );
        } else {
            return (
                <>
                    <IconButton
                        data-testid="@metadata/edit"
                        intent="neutral"
                        icon={PencilSimpleIcon}
                        onClick={onEdit}
                        tooltip={{
                            content: (
                                <FormattedMessage
                                    id="TR_LABELING_EDIT_LABEL"
                                    defaultMessage="Edit"
                                />
                            ),
                            delayShow: 1000,
                        }}
                        {...commonProps}
                    />
                    {isDeleteButtonVisible && (
                        <IconButton
                            data-testid="@metadata/delete"
                            intent="critical"
                            icon={TrashIcon}
                            onClick={onDelete}
                            tooltip={{
                                content: (
                                    <FormattedMessage
                                        id="TR_LABELING_REMOVE_LABEL"
                                        defaultMessage="Remove"
                                    />
                                ),
                                delayShow: 1000,
                            }}
                            {...commonProps}
                        />
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
