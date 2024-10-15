import { Button, ButtonProps, IconButton, IconButtonProps } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';

export const HeaderActionButton = ({
    icon,
    onClick,
    'data-testid': dataTestId,
    variant,
    size,
    isDisabled,
    children,
}: Pick<ButtonProps, 'onClick' | 'data-testid' | 'variant' | 'size' | 'isDisabled' | 'children'> &
    Pick<IconButtonProps, 'icon'>) => {
    const layoutSize = useSelector(state => state.resize.size);

    const isMobileLayout = layoutSize === 'TINY';
    const commonProps = { icon, onClick, 'data-testid': dataTestId, variant, size, isDisabled };

    return isMobileLayout ? (
        <IconButton {...commonProps} />
    ) : (
        <Button {...commonProps}>{children}</Button>
    );
};
