import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TextPropsKeys, TextProps } from '../typography/utils';
import { TransientProps } from '../../utils/transientProps';
import { FlexDirection, Flex, Row } from '../Flex/Flex';
import { IconName, Icon } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';
import { InfoItemVerticalAlignment, InfoItemVariant } from './types';
import {
    mapVerticalAlignmentToAlignItems,
    mapTypographyStyleToIconSize,
    mapTypographyStyleToGap,
} from './utils';

export const allowedInfoItemTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoItemTextProps)[number]>;

export const allowedInfoItemFrameProps = ['margin', 'flex'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoItemFrameProps)[number]>;

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
        variant?: InfoItemVariant;
        labelWidth?: string | number;
        verticalAlignment?: InfoItemVerticalAlignment;
    };

export const InfoItem = ({
    children,
    label,
    direction = 'column',
    iconName,
    typographyStyle = 'hint',
    variant = 'tertiary',
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
                    gap={mapTypographyStyleToGap(typographyStyle)}
                    width={labelWidth}
                    flex={labelWidth ? '0 0 auto' : '1 0 auto'}
                >
                    {iconName && (
                        <Icon
                            name={iconName}
                            size={mapTypographyStyleToIconSize(typographyStyle)}
                            variant={variant}
                        />
                    )}
                    <Text
                        variant={variant}
                        typographyStyle={typographyStyle}
                        as="div"
                        ellipsisLineCount={1}
                    >
                        {label}
                    </Text>
                </Row>
                {children}
            </Flex>
        </Container>
    );
};
