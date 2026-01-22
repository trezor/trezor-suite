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
import { ButtonIntent, ButtonPriority, ButtonSize, CommonButtonProps } from '../types';
import {
    commonButtonStyles,
    mapPropsToCSS,
    mapPropsToColor,
    mapSizeToBorderRadius,
    mapSizeToIconSize,
    pickButtonProps,
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

export type IconButtonProps = CommonButtonProps &
    AllowedIconButtonFrameProps & {
        size?: ButtonSize;
        icon: IconName;
        'data-testid'?: string;
    };

export const IconButton = ({
    'data-testid': dataTestId,
    icon,
    size = 'medium',
    ...props
}: IconButtonProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(props, allowedIconButtonFrameProps);
    const { intent, priority, isInverse, ...buttonProps } = pickButtonProps(props);
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
            $intent={intent}
            $isInverse={isInverse}
            {...buttonProps}
            {...frameProps}
        >
            <Box padding={mapSizeToPadding(size)}>
                {props.isLoading ? (
                    <Spinner
                        isGrey={true}
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
