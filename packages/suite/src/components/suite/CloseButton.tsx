import { IconButton, IconButtonProps } from '@trezor/components';

export const CloseButton = (props: Omit<IconButtonProps, 'icon'>) => (
    <IconButton variant="tertiary" size="small" icon="CROSS" {...props} />
);
