import { Children, Fragment, ReactNode, useId } from 'react';

import { SpacingValuesNew } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, IconVariant } from '../Icon/Icon';
import { Text, TextVariant } from '../typography/Text/Text';
import { TextProps, TextPropsKeys } from '../typography/utils';

export const allowedInfoSegmentsTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoSegmentsTextProps)[number]>;

export const allowedInfoSegmentsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoSegmentsFrameProps)[number]>;

export type InfoSegmentsProps = AllowedFrameProps &
    AllowedTextProps & {
        variant?: TextVariant;
        'data-testid'?: string;
        gap?: SpacingValuesNew;
        children: Array<ReactNode>;
    };

export const InfoSegments = ({
    children,
    typographyStyle,
    variant,
    margin,
    gap = 4,
    'data-testid': dataTestId,
}: InfoSegmentsProps) => {
    const validChildren = Children.toArray(children).filter(child => Boolean(child));
    const id = useId();

    return (
        <Text
            data-testid={dataTestId}
            as="div"
            typographyStyle={typographyStyle}
            margin={margin}
            variant={variant}
        >
            <Row gap={gap} flexWrap="wrap">
                {validChildren.map((child, index) => (
                    <Fragment key={`${id}-${index}`}>
                        {child}
                        {index < validChildren.length - 1 && (
                            <Icon
                                name="dotOutlineFilled"
                                size={16}
                                variant={variant as IconVariant}
                            />
                        )}
                    </Fragment>
                ))}
            </Row>
        </Text>
    );
};
