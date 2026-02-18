import { ReactNode } from 'react';

import styled from 'styled-components';

import { SpacingValues, spacings } from '@trezor/theme';

import { InfoItemVerticalAlignment } from './types';
import {
    mapIntentToIconVariant,
    mapTypographyStyleToIconGap,
    mapTypographyStyleToIconSize,
    mapTypographyStyleToLabelGap,
    mapVerticalAlignmentToAlignItems,
} from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Flex, Row } from '../Flex/Flex';
import { FlexDirection } from '../Flex/FlexProp';
import { Icon, IconName } from '../Icon/Icon';
import { Text, TextIntent, TextPriority } from '../typography/Text/Text';
import { TextProps as TextPropsCommon, TextPropsKeys } from '../typography/utils';

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
    const iconVariant = mapIntentToIconVariant({ intent, priority, isDisabled });

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
                            variant={iconVariant}
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
