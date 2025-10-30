import { NewIconButton, NewIconButtonProps } from '@trezor/components';

export const CloseButton = (props: Omit<NewIconButtonProps, 'icon'>) => (
    <NewIconButton intent="neutral" priority="secondary" icon="x" {...props} />
);
