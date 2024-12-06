import { ReactNode } from 'react';

import { spacings } from '@trezor/theme';

import { Paragraph } from '../typography/Paragraph/Paragraph';
import { Icon, IconName } from '../Icon/Icon';
import { Row } from '../Flex/Flex';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';

export const allowedNoteFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export type NoteProps = AllowedFrameProps & {
    iconName?: IconName;
    children: ReactNode;
};

export const Note = ({ children, iconName = 'info', margin }: NoteProps) => (
    <Row gap={spacings.xxs} margin={margin}>
        <Icon name={iconName} size={16} variant="tertiary" />
        <Paragraph typographyStyle="hint" variant="tertiary">
            {children}
        </Paragraph>
    </Row>
);
