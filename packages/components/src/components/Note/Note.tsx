import { type ReactNode } from 'react';

import { type SpacingValues, spacings } from '@trezor/theme';

import { type FrameProps, type FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, type IconName } from '../Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';
import { type TextIntent, type TextPriority } from '../typography/Text/Text';

export const allowedNoteFrameProps = ['margin', 'minWidth'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export type NoteProps = AllowedFrameProps & {
    iconName?: IconName;
    intent?: TextIntent;
    priority?: TextPriority;
    isDisabled?: boolean;
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
    intent = 'neutral',
    priority = 'secondary',
    isDisabled = false,
    'data-testid': dataTestId,
}: NoteProps) => (
    <Row gap={gap} margin={margin} minWidth={minWidth}>
        <Icon
            name={iconName}
            size={16}
            intent={intent}
            priority={priority}
            isDisabled={isDisabled}
        />
        <Paragraph
            data-testid={dataTestId}
            typographyStyle="body-sm"
            intent={intent}
            priority={priority}
            isDisabled={isDisabled}
        >
            {children}
        </Paragraph>
    </Row>
);
