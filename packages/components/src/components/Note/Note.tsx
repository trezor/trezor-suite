import { ReactNode } from 'react';

import { SpacingValues, spacings } from '@trezor/theme';

import { UIVariant } from '../../config/types';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';

export const allowedNoteFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export const noteVariants = ['tertiary', 'info', 'warning', 'destructive'] as const;

export type NoteVariant = Extract<UIVariant, (typeof noteVariants)[number]>;

export type NoteProps = AllowedFrameProps & {
    iconName?: IconName;
    variant?: NoteVariant;
    gap?: SpacingValues;
    children: ReactNode;
};

export const Note = ({
    children,
    iconName = 'info',
    margin,
    gap = spacings.xxs,
    variant = 'tertiary',
}: NoteProps) => (
    <Row gap={gap} margin={margin}>
        <Icon name={iconName} size={16} variant={variant} />
        <Paragraph typographyStyle="hint" variant={variant}>
            {children}
        </Paragraph>
    </Row>
);
