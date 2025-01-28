import { ReactNode } from 'react';

import { spacings } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';

export const allowedNoteFrameProps = ['margin', 'gap'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export type NoteProps = AllowedFrameProps & {
    iconName?: IconName;
    children: ReactNode;
};

export const Note = ({ children, iconName = 'info', margin, gap = spacings.xxs }: NoteProps) => (
    <Row gap={gap} margin={margin}>
        <Icon name={iconName} size={16} variant="tertiary" />
        <Paragraph typographyStyle="hint" variant="tertiary">
            {children}
        </Paragraph>
    </Row>
);
