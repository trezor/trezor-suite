import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type SpacingValues, spacings } from '@trezor/theme';

import { type InfoItemVerticalAlignment } from './types';
import {
    mapTypographyStyleToIconGap,
    mapTypographyStyleToIconSize,
    mapTypographyStyleToLabelGap,
    mapVerticalAlignmentToAlignItems,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { Flex, Row } from '../Flex/Flex';
import { type FlexDirection } from '../Flex/FlexProp';
import { Icon, type IconName } from '../Icon/Icon';
import { Text, type TextIntent, type TextPriority } from '../typography/Text/Text';
import { type TextProps as TextPropsCommon, type TextPropsKeys } from '../typography/utils';

export const allowedInfoItemTextProps = [
    'typographyStyle',
    'ellipsisLineCount',
] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextPropsCommon, (typeof allowedInfoItemTextProps)[number]>;

export const allowedInfoItemFrameProps = [
    'margin',
    'flex',
    'width',
    'maxWidth',
] as const satisfies FramePropsKeys[];
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
        intent?: TextIntent;
        priority?: TextPriority;
        isDisabled?: boolean;
        labelWidth?: string | number;
        verticalAlignment?: InfoItemVerticalAlignment;
        gap?: SpacingValues;
        'data-testid'?: string;
    };

export const InfoItem = ({
    ellipsisLineCount,
    children,
    label,
    direction = 'column',
    iconName,
    typographyStyle = 'body-sm',
    intent = 'neutral',
    priority = 'secondary',
    isDisabled = false,
    gap,
    labelWidth,
    verticalAlignment = 'center',
    'data-testid': dataTestId,
    ...rest
}: InfoItemProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedInfoItemFrameProps);
    const isRow = direction === 'row';

    return (
        <Container data-testid={dataTestId} {...frameProps}>
            <Flex
                direction={direction}
                alignItems={isRow ? mapVerticalAlignmentToAlignItems(verticalAlignment) : 'normal'}
                gap={gap ?? (isRow ? spacings.md : mapTypographyStyleToLabelGap(typographyStyle))}
            >
                <Row
                    gap={mapTypographyStyleToIconGap(typographyStyle)}
                    width={labelWidth}
                    flex={labelWidth ? '0 0 auto' : '1 0 auto'}
                    height={24}
                >
                    {iconName && (
                        <Icon
                            name={iconName}
                            size={mapTypographyStyleToIconSize(typographyStyle)}
                            intent={intent}
                            priority={priority}
                            isDisabled={isDisabled}
                        />
                    )}
                    <Text
                        intent={intent}
                        priority={priority}
                        isDisabled={isDisabled}
                        typographyStyle={typographyStyle}
                        as="div"
                        ellipsisLineCount={ellipsisLineCount ?? 1}
                    >
                        {label}
                    </Text>
                </Row>
                {children}
            </Flex>
        </Container>
    );
};
