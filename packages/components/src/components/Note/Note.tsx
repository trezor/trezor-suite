import type { ReactNode } from 'react';

import type { SpacingValues } from '@trezor/theme';
import { spacings } from '@trezor/theme';

import type { UIVariant } from '../../config/types';
import type { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import type { IconName } from '../Icon/Icon';
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
    iconName?: IconName;
    variant?: NoteVariant;
    gap?: SpacingValues;
    children: ReactNode;
    'data-testid'?: string;
};

export const Note = ({
    children,
    iconName = 'info',
    margin,
    gap = spacings.xxs,
    minWidth,
    variant = 'tertiary',
    'data-testid': dataTestId,
}: NoteProps) => (
    <Row gap={gap} margin={margin} minWidth={minWidth}>
        <Icon name={iconName} size={16} variant={variant} />
        <Paragraph data-testid={dataTestId} typographyStyle="hint" variant={variant}>
            {children}
        </Paragraph>
    </Row>
);
