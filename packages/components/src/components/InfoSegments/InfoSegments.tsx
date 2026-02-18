import { Children, Fragment, ReactNode, useId } from 'react';

import { SpacingValuesNew } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { Icon, IconProps } from '../Icon/Icon';
import { Text, TextIntent, TextProps } from '../typography/Text/Text';
import { TextProps as TextPropsCommon, TextPropsKeys } from '../typography/utils';

export const allowedInfoSegmentsTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextPropsCommon, (typeof allowedInfoSegmentsTextProps)[number]>;

export const allowedInfoSegmentsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoSegmentsFrameProps)[number]>;

export type InfoSegmentsProps = AllowedFrameProps &
    AllowedTextProps & {
        intent?: TextIntent;
        priority?: TextProps['priority'];
        isDisabled?: TextProps['isDisabled'];
        'data-testid'?: string;
        gap?: SpacingValuesNew;
        children: Array<ReactNode>;
    };

export const InfoSegments = ({
    children,
    typographyStyle,
    intent,
    priority,
    isDisabled,
    margin,
    gap = 4,
    'data-testid': dataTestId,
}: InfoSegmentsProps) => {
    const validChildren = Children.toArray(children).filter(child => Boolean(child));
    const id = useId();
    const iconProps: Pick<IconProps, 'intent' | 'priority' | 'isDisabled'> = {
        intent: intent ?? 'neutral',
        priority,
        isDisabled,
    };

    return (
        <Text
            data-testid={dataTestId}
            as="div"
            typographyStyle={typographyStyle}
            margin={margin}
            intent={intent}
            priority={priority}
            isDisabled={isDisabled}
        >
            <Row gap={gap} flexWrap="wrap">
                {validChildren.map((child, index) => (
                    <Fragment key={`${id}-${index}`}>
                        {child}
                        {index < validChildren.length - 1 && (
                            <Icon name="dotOutlineFilled" size={16} {...iconProps} />
                        )}
                    </Fragment>
                ))}
            </Row>
        </Text>
    );
};
