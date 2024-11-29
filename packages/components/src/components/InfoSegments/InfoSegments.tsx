import { ReactNode, Children, useId, Fragment } from 'react';

import { spacings } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { TextPropsKeys, TextProps } from '../typography/utils';
import { Text, TextVariant } from '../typography/Text/Text';
import { Row } from '../Flex/Flex';

export const allowedInfoSegmentsTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoSegmentsTextProps)[number]>;

export const allowedInfoSegmentsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoSegmentsFrameProps)[number]>;

export type InfoSegmentsProps = AllowedFrameProps &
    AllowedTextProps & {
        variant?: TextVariant;
    } & { children: Array<ReactNode> };

export const InfoSegments = ({ children, typographyStyle, variant, margin }: InfoSegmentsProps) => {
    const validChildren = Children.toArray(children).filter(child => Boolean(child));
    const id = useId();

    return (
        <Text as="div" typographyStyle={typographyStyle} margin={margin} variant={variant}>
            <Row gap={spacings.xxs}>
                {validChildren.map((child, index) => (
                    <Fragment key={`${id}-${index}`}>
                        {child}
                        {index < validChildren.length - 1 && <span>&bull;</span>}
                    </Fragment>
                ))}
            </Row>
        </Text>
    );
};
