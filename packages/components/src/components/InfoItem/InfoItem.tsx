import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings, TypographyStyle } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TextPropsKeys, TextProps } from '../typography/utils';
import { TransientProps } from '../../utils/transientProps';
import { FlexDirection, Flex, Row, FlexAlignItems } from '../Flex/Flex';
import { IconName, Icon } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';
import { UIVerticalAlignment } from '../../config/types';

export const allowedInfoItemTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoItemTextProps)[number]>;

export const allowedInfoItemFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoItemFrameProps)[number]>;

export const verticalAlignments = ['top', 'center', 'bottom'] as const;
type VerticalAlignment = Extract<UIVerticalAlignment, (typeof verticalAlignments)[number]>;

const mapVerticalAlignmentToAlignItems = (verticalAlignment: VerticalAlignment): FlexAlignItems => {
    const alignItemsMap: Record<VerticalAlignment, FlexAlignItems> = {
        top: 'baseline',
        center: 'center',
        bottom: 'flex-end',
    };

    return alignItemsMap[verticalAlignment];
};

type ContainerProps = TransientProps<AllowedFrameProps & AllowedTextProps>;

const Container = styled.div<ContainerProps>`
    width: 100%;

    ${withFrameProps}
`;

export type InfoItemProps = AllowedFrameProps &
    AllowedTextProps & {
        children?: ReactNode;
        direction?: FlexDirection;
        iconName?: IconName;
        label: ReactNode;
        labelTypographyStyle?: TypographyStyle;
        labelWidth?: string | number;
        verticalAlignment?: VerticalAlignment;
    };

export const InfoItem = ({
    children,
    label,
    direction = 'column',
    iconName,
    typographyStyle = 'body',
    labelTypographyStyle = 'hint',
    labelWidth,
    verticalAlignment = 'center',
    ...rest
}: InfoItemProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedInfoItemFrameProps);
    const isRow = direction === 'row';

    return (
        <Container {...frameProps}>
            <Flex
                direction={direction}
                alignItems={isRow ? mapVerticalAlignmentToAlignItems(verticalAlignment) : 'normal'}
                gap={isRow ? spacings.md : spacings.xxxs}
            >
                <Row
                    gap={spacings.xxs}
                    width={labelWidth}
                    flex={labelWidth ? '0 0 auto' : '1 0 auto'}
                >
                    {iconName && <Icon name={iconName} size="medium" variant="tertiary" />}
                    <Text
                        variant="tertiary"
                        typographyStyle={labelTypographyStyle}
                        as="div"
                        ellipsisLineCount={1}
                    >
                        {label}
                    </Text>
                </Row>
                <Text
                    as="div"
                    typographyStyle={typographyStyle}
                    align={isRow && !labelWidth ? 'right' : 'left'}
                    ellipsisLineCount={isRow ? 1 : undefined}
                >
                    {children}
                </Text>
            </Flex>
        </Container>
    );
};
