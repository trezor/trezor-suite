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
import { FlexDirection, Flex, Row } from '../Flex/Flex';
import { IconName, Icon } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

export const allowedInfoRowTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoRowTextProps)[number]>;

export const allowedInfoRowFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoRowFrameProps)[number]>;

type ContainerProps = TransientProps<AllowedFrameProps & AllowedTextProps>;

const Container = styled.div<ContainerProps>`
    width: 100%;

    ${withFrameProps}
`;

export type InfoRowProps = AllowedFrameProps &
    AllowedTextProps & {
        children?: ReactNode;
        direction?: FlexDirection;
        iconName?: IconName;
        label: ReactNode;
        labelTypographyStyle?: TypographyStyle;
    };

export const InfoRow = ({
    children,
    label,
    direction = 'column',
    iconName,
    typographyStyle = 'body',
    labelTypographyStyle = 'hint',
    ...rest
}: InfoRowProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedInfoRowFrameProps);
    const isRow = direction === 'row';

    return (
        <Container {...frameProps}>
            <Flex
                direction={direction}
                alignItems={isRow ? 'center' : 'stretch'}
                justifyContent={isRow ? 'space-between' : undefined}
                gap={isRow ? spacings.md : spacings.xxxs}
            >
                <Row gap={spacings.xxs}>
                    {iconName && <Icon name={iconName} size="medium" variant="tertiary" />}
                    <Text variant="tertiary" typographyStyle={labelTypographyStyle} as="div">
                        {label}
                    </Text>
                </Row>
                <Text as="div" typographyStyle={typographyStyle} align={isRow ? 'right' : 'left'}>
                    {children}
                </Text>
            </Flex>
        </Container>
    );
};
