import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Icon, type IconName } from '../../Icon/Icon';
import { ShortcutBadge } from '../../ShortcutBadge/ShortcutBadge';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import {
    type ButtonIntent,
    type ButtonPriority,
    type ButtonSize,
    type CommonButtonProps,
} from '../types';
import {
    commonButtonStyles,
    mapPropsToCSS,
    mapPropsToColorToken,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
    mapSizeToTypographyStyle,
    pickButtonProps,
} from '../utils';
import { mapSizeToGap, mapSizeToPadding } from './utils';
import { type Keys } from '../../ShortcutBadge/keyboardKeys';

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
    $isFloating: boolean;
    disabled: boolean;
};

const Container = styled.button<ButtonContainerProps>`
    ${commonButtonStyles}

    border-radius: ${({ $size }) => mapSizeToBorderRadius($size)};

    ${({ $intent, $priority, disabled, $isInverse, $isFloating, theme }) =>
        mapPropsToCSS($intent, $priority, disabled, $isInverse, theme, $isFloating)}

    ${withFrameProps}
`;

export type ButtonProps = CommonButtonProps &
    AllowedButtonFrameProps & {
        size?: ButtonSize;
        iconLeft?: IconName;
        iconRight?: IconName;
        children: React.ReactNode;
        'data-testid'?: string;
        shortcut?: Keys[];
    };

export const Button = ({
    'data-testid': dataTestId,
    children,
    iconLeft,
    iconRight,
    shortcut,
    size = 'medium',
    isFloating = false,
    ...props
}: ButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(props, allowedButtonFrameProps);
    const { intent, priority, isInverse, ...buttonProps } = pickButtonProps(props);
    const colorToken = mapPropsToColorToken(intent, priority, buttonProps.disabled, isInverse);

    const iconProps = {
        size: mapSizeToIconSize(size),
        color: colorToken,
    };

    return (
        <Container
            data-testid={dataTestId}
            $size={size}
            $priority={priority}
            $isInverse={isInverse}
            $intent={intent}
            $isFloating={isFloating}
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
                        isDisabled={true}
                        size={mapSizeToIconSize(size)}
                        data-testid={`${dataTestId}/spinner`}
                    />
                )}
                {iconLeft && !props.isLoading && <Icon name={iconLeft} {...iconProps} />}
                <Box padding={{ horizontal: 4 }} overflow="hidden">
                    <Text
                        as="div"
                        typographyStyle={mapSizeToTypographyStyle(size)}
                        color={colorToken}
                        ellipsisLineCount={1}
                    >
                        {children}
                    </Text>
                </Box>
                {(iconRight || buttonProps.target === '_blank') && (
                    <Icon name={iconRight ?? 'arrowLineUpRight'} {...iconProps} />
                )}
                {shortcut?.length && (
                    <Text as="div" color={colorToken}>
                        <ShortcutBadge shortcut={shortcut} />
                    </Text>
                )}
            </Row>
        </Container>
    );
};

export type { ButtonIntent };
