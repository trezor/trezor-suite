import { ButtonHTMLAttributes } from 'react';

import styled, { useTheme } from 'styled-components';

import { borders, spacingsPx } from '@trezor/theme';

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
import { ButtonIntent, ButtonPriority, ButtonSize } from '../types';
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

export const allowedButtonFrameProps = [
    'margin',
    'minWidth',
    'maxWidth',
    'width',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedButtonFrameProps = Pick<FrameProps, (typeof allowedButtonFrameProps)[number]>;

type ButtonContainerProps = TransientProps<AllowedButtonFrameProps> & {
    $size: ButtonSize;
    $priority: ButtonPriority;
    $intent: ButtonIntent;
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

const ShortcutContainer = styled.div`
    background-color: ${({ theme }) => addAlphaToHex(theme.baseFillElementNeutralDark, 0.09)};
    border-radius: ${borders.radii.xxs};
    padding: ${spacingsPx.xxs};
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

export type ButtonProps = SelectedHTMLButtonProps &
    AllowedButtonFrameProps &
    ExclusiveAProps & {
        size?: ButtonSize;
        isDisabled?: boolean;
        isInverse?: boolean;
        isLoading?: boolean;
        iconLeft?: IconName;
        iconRight?: IconName;
        children: React.ReactNode;
        'data-testid'?: string;
        intent?: ButtonIntent;
        priority?: ButtonPriority;
        shortcut?: string[];
        className?: string;
    };

export const Button = ({
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
}: ButtonProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedButtonFrameProps);
    const isLink = href !== undefined;
    const color = mapPropsToColor(intent, priority, isDisabled || isLoading, isInverse, theme);

    const iconProps = {
        size: mapSizeToIconSize(size),
        color,
    };

    return (
        <Container
            as={isLink ? 'a' : 'button'}
            data-testid={dataTestId}
            $isDisabled={isDisabled || isLoading}
            disabled={isDisabled || isLoading}
            href={href}
            onClick={isDisabled || isLoading ? undefined : onClick}
            tabIndex={tabIndex}
            target={isLink ? target || '_blank' : undefined}
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
                            <ShortcutContainer key={index}>
                                <Text typographyStyle="label" color={color} case="uppercase">
                                    {hotkey}
                                </Text>
                            </ShortcutContainer>
                        ))}
                    </Row>
                )}
            </Row>
        </Container>
    );
};
