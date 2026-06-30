import { Badge, Tooltip } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

type AddedBadgeProps = {
    children: React.ReactNode;
};

export const AddedBadge = ({ children }: AddedBadgeProps) => (
    <Tooltip content="Added in version">
        <Badge intent="brand" size="small" iconLeft={PlusIcon}>
            {children}
        </Badge>
    </Tooltip>
);
