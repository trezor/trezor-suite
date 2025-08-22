import { ButtonHTMLAttributes } from 'react';

import styled, { useTheme } from 'styled-components';

import { NewButtonIntent, NewButtonPriority, NewButtonSize } from './types';
import {
    addAlphaToHex,
    mapPropsToCSS,
    mapPropsToColor,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
    mapSizeToPadding,
    mapSizeToTypographyStyle,
} from './utils';
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
    disabled: boolean;
};

const Container = styled.button<ButtonContainerProps>`
    border: 0;
    padding: 0;
    cursor: pointer;
    display: block;
    overflow: hidden;
    -webkit-app-region: no-drag;
    transition: 0.1s ease-in-out;

    &:focus-visible {
        outline: 4px solid ${({ theme }) => theme.stateBorderElementFocused};
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    border-radius: ${({ $size }) => mapSizeToBorderRadius($size)};

    ${({ $intent, $priority, disabled, $isInverse, theme }) =>
        mapPropsToCSS($intent, $priority, disabled, $isInverse, theme)}

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
            disabled={isDisabled}
            onClick={onClick}
            tabIndex={tabIndex}
            target={target}
            type={type}
            $size={size}
            $priority={priority}
            $intent={intent}
            $isInverse={isInverse}
            {...frameProps}
        >
            <Row gap={4} padding={mapSizeToPadding(size)} justifyContent="center" overflow="hidden">
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
