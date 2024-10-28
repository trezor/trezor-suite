import { ReactNode } from 'react';
import { spacings } from '@trezor/theme';
import styled from 'styled-components';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TextPropsKeys, TextProps } from '../typography/utils';
import { TransientProps } from '../../utils/transientProps';
import { FlexDirection, Flex } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

export const allowedInfoRowTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedInfoRowTextProps = Pick<TextProps, (typeof allowedInfoRowTextProps)[number]>;

export const allowedInfoRowFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoRowFrameProps)[number]>;

type ContainerProps = TransientProps<AllowedFrameProps & AllowedInfoRowTextProps>;

const Container = styled.div<ContainerProps>`
    width: 100%;

    ${withFrameProps}
`;

export type InfoRowProps = AllowedFrameProps &
    AllowedInfoRowTextProps & {
        children?: ReactNode;
        direction?: FlexDirection;
        label: ReactNode;
    };

export const InfoRow = ({
    children,
    label,
    direction = 'column',
    typographyStyle = 'body',
    ...rest
}: InfoRowProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedInfoRowFrameProps);
    const isRow = direction === 'row';

    return (
        <Container {...frameProps}>
            <Flex
                direction={direction}
                alignItems={isRow ? 'center' : 'flex-start'}
                justifyContent={isRow ? 'space-between' : undefined}
                gap={isRow ? spacings.md : spacings.xxs}
            >
                <Text variant="tertiary" typographyStyle="hint" as="div">
                    {label}
                </Text>
                <Text as="div" typographyStyle={typographyStyle} align={isRow ? 'right' : 'left'}>
                    {children}
                </Text>
            </Flex>
        </Container>
    );
};
