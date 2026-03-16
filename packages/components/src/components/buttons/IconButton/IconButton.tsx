import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { Box } from '../../Box/Box';
import { Icon, type IconName } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
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
    const frameProps = pickAndPrepareFrameProps(props, allowedIconButtonFrameProps);
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
            $intent={intent}
            $isInverse={isInverse}
            {...buttonProps}
            {...frameProps}
        >
            <Box padding={mapSizeToPadding(size)}>
                {props.isLoading ? (
                    <Spinner
                        isDisabled={true}
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
