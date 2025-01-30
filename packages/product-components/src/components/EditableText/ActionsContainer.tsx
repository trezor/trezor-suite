import React from 'react';
import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { Badge, Box, IconButton, Row, Spinner, Tooltip, useElevation } from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBorder,
    spacings,
    spacingsPx,
    zIndices,
} from '@trezor/theme';

type ActionContainerProps = {
    onEdit: () => void;
    onDelete: () => void;
    onSave: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    isEditable: boolean;
    isJustSaved: boolean;
    isDisabled?: boolean;
    isHovered: boolean;
    isDeleteButtonVisible: boolean;
};

const ActionsBackground = styled.div<{ $elevation: Elevation }>`
    background: ${({ theme }) => mapElevationToBorder({ theme, $elevation: 2 })};
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxs};
    margin-left: ${spacingsPx.xs};
`;

export const ActionsContainer = ({
    onEdit,
    onDelete,
    onSave,
    onCancel,
    isLoading,
    isEditable,
    isJustSaved,
    isDisabled,
    isHovered,
    isDeleteButtonVisible,
}: ActionContainerProps) => {
    const { elevation } = useElevation();

    return (
        <Box
            as="span"
            position={{ type: 'absolute', top: 0, left: '100%' }}
            height="100%"
            zIndex={zIndices.tooltip}
            cursor="pointer"
        >
            <Row alignItems="center" height="100%">
                {isLoading ? (
                    <ActionsBackground $elevation={elevation}>
                        <Row gap={spacings.xxs}>
                            <Spinner size={20} />
                            <FormattedMessage id="TR_LOADING" defaultMessage="Loading" />
                        </Row>
                    </ActionsBackground>
                ) : (
                    <>
                        {!isJustSaved && isEditable && (
                            <ActionsBackground $elevation={elevation}>
                                <Row gap={spacings.xxs}>
                                    <Tooltip
                                        content={
                                            <FormattedMessage
                                                id="TR_CONFIRM"
                                                defaultMessage="Confirm"
                                            />
                                        }
                                        hasArrow
                                        delayShow={1000}
                                        cursor="inherit"
                                    >
                                        <IconButton
                                            icon="check"
                                            size="tiny"
                                            onClick={onSave}
                                            isDisabled={isDisabled}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        content={
                                            <FormattedMessage
                                                id="TR_CANCEL"
                                                defaultMessage="Cancel"
                                            />
                                        }
                                        hasArrow
                                        delayShow={1000}
                                        cursor="inherit"
                                    >
                                        <IconButton
                                            variant="destructive"
                                            icon="x"
                                            size="tiny"
                                            onClick={onCancel}
                                            isDisabled={isDisabled}
                                        />
                                    </Tooltip>
                                </Row>
                            </ActionsBackground>
                        )}
                        {!isJustSaved && !isEditable && isHovered && (
                            <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                                <IconButton
                                    variant="tertiary"
                                    icon="pencil"
                                    size="tiny"
                                    onClick={onEdit}
                                    isDisabled={isDisabled}
                                />
                                {isDeleteButtonVisible && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="x"
                                        size="tiny"
                                        onClick={onDelete}
                                        isDisabled={isDisabled}
                                    />
                                )}
                            </Row>
                        )}
                        {isJustSaved && (
                            <Row gap={spacings.xxs} margin={{ left: spacings.sm }}>
                                <Badge icon="check" variant="primary">
                                    <FormattedMessage id="TR_SAVED" defaultMessage="Saved" />
                                </Badge>
                            </Row>
                        )}
                    </>
                )}
            </Row>
        </Box>
    );
};
