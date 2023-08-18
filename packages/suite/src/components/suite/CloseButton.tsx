import styled from 'styled-components';
import { IconButton, useTheme, IconButtonProps } from '@trezor/components';
import { darken } from 'polished';

const StyledIconButton = styled(IconButton)`
    width: 32px;
    height: 32px;
    background: ${({ theme }) => theme.STROKE_GREY};

    &:hover,
    &:focus,
    &:active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
    }
`;

export const CloseButton = (props: Omit<IconButtonProps, 'icon'>) => {
    const theme = useTheme();
    return (
        <StyledIconButton
            icon="CROSS"
            variant="secondary"
            color={theme.TYPE_LIGHT_GREY}
            {...props}
        />
    );
};
