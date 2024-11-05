import { ReactNode } from 'react';

import { spacings } from '@trezor/theme';

import { Paragraph } from '../typography/Paragraph/Paragraph';
import { Icon } from '../Icon/Icon';
import { Row } from '../Flex/Flex';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';

export const allowedNoteFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNoteFrameProps)[number]>;

export type NoteProps = AllowedFrameProps & {
    children: ReactNode;
    className?: string;
};

export const Note = ({ children, className, margin }: NoteProps) => (
    <Row className={className} gap={spacings.xs} margin={margin}>
        <Icon name="info" size={14} variant="tertiary" />
        <Paragraph typographyStyle="hint" variant="tertiary">
            {children}
        </Paragraph>
    </Row>
);
