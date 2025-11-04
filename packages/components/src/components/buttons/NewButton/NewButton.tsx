import { ButtonHTMLAttributes } from 'react';

import styled, { useTheme } from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Icon, IconName } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import { NewButtonIntent, NewButtonPriority, NewButtonSize } from '../types';
import {
    addAlphaToHex,
    commonButtonStyles,
    mapPropsToCSS,
    mapPropsToColor,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
    mapSizeToTypographyStyle,
} from '../utils';
import { mapSizeToGap, mapSizeToPadding } from './utils';

export const allowedNewButtonFrameProps = [
    'margin',
    'minWidth',
    'maxWidth',
    'width',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedNewButtonFrameProps = Pick<
    FrameProps,
    (typeof allowedNewButtonFrameProps)[number]
>;

type ButtonContainerProps = TransientProps<AllowedNewButtonFrameProps> & {
    $size: NewButtonSize;
    $priority: NewButtonPriority;
    $intent: NewButtonIntent;
    $isInverse: boolean;
    $isDisabled: boolean;
};

const Container = styled.button<ButtonContainerProps>`
    ${commonButtonStyles}

    border-radius: ${({ $size }) => mapSizeToBorderRadius($size)};

    ${({ $intent, $priority, $isDisabled, $isInverse, theme }) =>
        mapPropsToCSS($intent, $priority, $isDisabled, $isInverse, theme)}

    ${withFrameProps}
`;

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'type' | 'tabIndex'
>;

type ExclusiveAProps =
    | { href?: undefined; target?: undefined }
    | {
          href?: string;
          target?: string;
      };

export type NewButtonProps = SelectedHTMLButtonProps &
    AllowedNewButtonFrameProps &
    ExclusiveAProps & {
        size?: NewButtonSize;
        isDisabled?: boolean;
        isInverse?: boolean;
        isLoading?: boolean;
        iconLeft?: IconName;
        iconRight?: IconName;
        children: React.ReactNode;
        'data-testid'?: string;
        intent?: NewButtonIntent;
        priority?: NewButtonPriority;
        shortcut?: string[];
        className?: string;
    };

export const NewButton = ({
    'data-testid': dataTestId,
    children,
    href,
    iconLeft,
    iconRight,
    intent = 'brand',
    isDisabled = false,
    isInverse = false,
    isLoading = false,
    onClick,
    shortcut,
    size = 'medium',
    tabIndex,
    target,
    type = 'button',
    priority = 'primary',
    // TODO: remove className
    className,
    ...rest
}: NewButtonProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedNewButtonFrameProps);
    const isLink = href !== undefined;
    const color = mapPropsToColor(intent, priority, isDisabled, isInverse, theme);

    const iconProps = {
        size: mapSizeToIconSize(size),
        color,
    };

    return (
        <Container
            as={isLink ? 'a' : 'button'}
            data-testid={dataTestId}
            $isDisabled={isDisabled}
            disabled={isDisabled || isLoading}
            href={href}
            onClick={isDisabled || isLoading ? undefined : onClick}
            tabIndex={tabIndex}
            target={target}
            type={type}
            $size={size}
            $priority={priority}
            $intent={intent}
            $isInverse={isInverse}
            className={className}
            {...frameProps}
        >
            <Row
                gap={mapSizeToGap(size)}
                padding={mapSizeToPadding(size)}
                justifyContent="center"
                overflow="hidden"
                width="100%"
            >
                {isLoading && (
                    <Spinner
                        isGrey={false}
                        bodyColor={color}
                        size={mapSizeToIconSize(size)}
                        data-testid={`${dataTestId}/spinner`}
                    />
                )}
                {iconLeft && !isLoading && <Icon name={iconLeft} {...iconProps} />}
                <Box padding={{ horizontal: 4 }} overflow="hidden">
                    {/* TODO: use variant/intent instead of color after refactoring Text and Icon components */}
                    <Text
                        as="div"
                        typographyStyle={mapSizeToTypographyStyle(size)}
                        color={color}
                        ellipsisLineCount={1}
                    >
                        {children}
                    </Text>
                </Box>
                {iconRight && !isLoading && <Icon name={iconRight} {...iconProps} />}
                {shortcut?.length && (
                    <Row gap={2}>
                        {shortcut.map((hotkey, index) => (
                            <Box
                                backgroundColor={addAlphaToHex(
                                    theme.baseFillElementNeutralDark,
                                    0.09,
                                )}
                                padding={{ horizontal: 4 }}
                                borderRadius={4}
                                key={index}
                            >
                                <Text typographyStyle="label" color={color} case="uppercase">
                                    {hotkey}
                                </Text>
                            </Box>
                        ))}
                    </Row>
                )}
            </Row>
        </Container>
    );
};
