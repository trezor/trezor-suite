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
import { ButtonIntent, ButtonPriority, ButtonSize, CommonButtonProps } from '../types';
import {
    addAlphaToHex,
    commonButtonStyles,
    mapPropsToCSS,
    mapPropsToColor,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
    mapSizeToTypographyStyle,
    pickButtonProps,
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
    disabled: boolean;
};

const Container = styled.button<ButtonContainerProps>`
    ${commonButtonStyles}

    border-radius: ${({ $size }) => mapSizeToBorderRadius($size)};

    ${({ $intent, $priority, disabled, $isInverse, theme }) =>
        mapPropsToCSS($intent, $priority, disabled, $isInverse, theme)}

    ${withFrameProps}
`;

const ShortcutContainer = styled.div`
    background-color: ${({ theme }) => addAlphaToHex(theme.baseFillElementNeutralDark, 0.09)};
    border-radius: ${borders.radii.xxs};
    padding: ${spacingsPx.xxs};
`;

export type ButtonProps = CommonButtonProps &
    AllowedButtonFrameProps & {
        size?: ButtonSize;
        isInverse?: boolean;
        iconLeft?: IconName;
        iconRight?: IconName;
        children: React.ReactNode;
        'data-testid'?: string;
        priority?: ButtonPriority;
        shortcut?: string[];
        className?: string;
    };

export const Button = ({
    'data-testid': dataTestId,
    children,
    iconLeft,
    iconRight,
    isInverse = false,
    intent = 'brand',
    shortcut,
    size = 'medium',
    priority = 'primary',
    // TODO: remove className
    className,
    ...props
}: ButtonProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(props, allowedButtonFrameProps);
    const buttonProps = pickButtonProps(props);
    const color = mapPropsToColor(intent, priority, buttonProps.disabled, isInverse, theme);

    const iconProps = {
        size: mapSizeToIconSize(size),
        color,
    };

    return (
        <Container
            data-testid={dataTestId}
            $size={size}
            $priority={priority}
            $isInverse={isInverse}
            $intent={intent}
            className={className}
            {...frameProps}
            {...buttonProps}
        >
            <Row
                gap={mapSizeToGap(size)}
                padding={mapSizeToPadding(size)}
                justifyContent="center"
                overflow="hidden"
                width="100%"
            >
                {props.isLoading && (
                    <Spinner
                        isGrey={true}
                        size={mapSizeToIconSize(size)}
                        data-testid={`${dataTestId}/spinner`}
                    />
                )}
                {iconLeft && !props.isLoading && <Icon name={iconLeft} {...iconProps} />}
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
                {iconRight && !props.isLoading && <Icon name={iconRight} {...iconProps} />}
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
