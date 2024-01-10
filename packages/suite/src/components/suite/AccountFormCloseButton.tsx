import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
// import { CloseButton } from 'src/components/suite';
import { IconButton } from '@trezor/components';

// const StyledIconButton = styled(IconButton)`
//     width: 32px;
//     height: 32px;
//     background: ${({ theme }) => theme.STROKE_GREY};

//     &:hover,
//     &:focus,
//     &:active {
//         background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
//     }

//     path {
//         fill: ${({ theme }) => theme.TYPE_LIGHT_GREY};
//     }
// `;

export const AccountFormCloseButton = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-index', { preserveParams: true }));

    return (
        <IconButton
            size="medium"
            icon="ARROW_LEFT"
            onClick={handleClick}
            data-test="@wallet/menu/close-button"
            variant="tertiary"
        />
    );

    // <StyledIconButton  onClick={handleClick} data-test="@wallet/menu/close-button" icon="CROSS" variant="secondary" {...props} />;
};
