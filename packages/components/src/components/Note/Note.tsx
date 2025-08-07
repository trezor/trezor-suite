import React, { ReactNode } from 'react';

import { SpacingValues, spacings } from '@trezor/theme';

import { UIVariant } from '../../config/types';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { IconProps } from '../Icon/Icon';
import { Icon } from '../Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';

export const allowedNoteFrameProps = ['margin', 'minWidth'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export const noteVariants = [
    'tertiary',
    'primary',
    'default',
    'info',
    'warning',
    'destructive',
    'disabled',
] as const;
export type NoteVariant = Extract<UIVariant, (typeof noteVariants)[number]>;

export type NoteProps = AllowedFrameProps & {
    icon?: React.ReactElement<IconProps> | 'info';
    variant?: NoteVariant;
    gap?: SpacingValues;
    children: ReactNode;
    'data-testid'?: string;
};

export const Note = ({
    children,
    icon = 'info',
    margin,
    gap = spacings.xxs,
    minWidth,
    variant = 'tertiary',
    'data-testid': dataTestId,
}: NoteProps) => (
    <Row gap={gap} margin={margin} minWidth={minWidth}>
        {icon === 'info' ? (
            <Icon name="info" size={16} variant={variant} />
        ) : (
            React.cloneElement(icon, { size: 16, variant })
        )}
        <Paragraph data-testid={dataTestId} typographyStyle="hint" variant={variant}>
            {children}
        </Paragraph>
    </Row>
);
