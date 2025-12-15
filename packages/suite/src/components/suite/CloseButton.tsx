import type { IconButtonProps } from '@trezor/components';
import { IconButton } from '@trezor/components';

export const CloseButton = (props: Omit<IconButtonProps, 'icon'>) => (
    <IconButton intent="neutral" priority="secondary" icon="x" {...props} />
);
