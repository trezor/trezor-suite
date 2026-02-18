import { ReactNode } from 'react';

import { SpacingValues, spacings } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, IconName, IconVariant } from '../Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';
import { TextIntent, TextPriority } from '../typography/Text/Text';

export const allowedNoteFrameProps = ['margin', 'minWidth'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

const mapTextPropsToIconVariant = (
    intent: TextIntent,
    priority: TextPriority,
    isDisabled: boolean,
): IconVariant => {
    if (isDisabled) return 'disabled';

    switch (intent) {
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        case 'critical':
            return 'destructive';
        case 'accentViolet':
            return 'purple';
        case 'brand':
            return 'primary';
        case 'accentOrange':
            return 'warning';
        case 'neutral':
            return priority === 'secondary' ? 'tertiary' : 'default';
    }
};

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
            variant={mapTextPropsToIconVariant(intent, priority, isDisabled)}
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
