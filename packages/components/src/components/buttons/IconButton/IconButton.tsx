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
import { Icon, IconName } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { ButtonIntent, ButtonPriority, ButtonSize } from '../types';
import {
    commonButtonStyles,
    mapPropsToCSS,
    mapPropsToColor,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
} from '../utils';
import { mapSizeToPadding } from './utils';

export const allowedIconButtonFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedIconButtonFrameProps = Pick<
    FrameProps,
    (typeof allowedIconButtonFrameProps)[number]
>;

type ButtonContainerProps = TransientProps<AllowedIconButtonFrameProps> & {
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

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'type' | 'tabIndex'
>;

export type IconButtonProps = SelectedHTMLButtonProps &
    AllowedIconButtonFrameProps & {
        size?: ButtonSize;
        isDisabled?: boolean;
        isInverse?: boolean;
        isLoading?: boolean;
        icon: IconName;
        'data-testid'?: string;
        intent?: ButtonIntent;
        priority?: ButtonPriority;
    };

export const IconButton = ({
    'data-testid': dataTestId,
    icon,
    intent = 'brand',
    isDisabled = false,
    isInverse = false,
    isLoading = false,
    onClick,
    size = 'medium',
    tabIndex,
    type = 'button',
    priority = 'primary',
    ...rest
}: IconButtonProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconButtonFrameProps);
    const color = mapPropsToColor(intent, priority, isDisabled, isInverse, theme);

    const iconProps = {
        size: mapSizeToIconSize(size),
        color,
    };

    return (
        <Container
            data-testid={dataTestId}
            disabled={isDisabled}
            onClick={onClick}
            tabIndex={tabIndex}
            type={type}
            $size={size}
            $priority={priority}
            $intent={intent}
            $isInverse={isInverse}
            {...frameProps}
        >
            <Box padding={mapSizeToPadding(size)}>
                {isLoading ? (
                    <Spinner
                        isGrey={false}
                        bodyColor={color}
                        size={mapSizeToIconSize(size)}
                        data-testid={`${dataTestId}/spinner`}
                    />
                ) : (
                    <Icon name={icon} {...iconProps} />
                )}
            </Box>
        </Container>
    );
};
