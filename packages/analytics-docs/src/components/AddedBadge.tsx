import { Badge, Tooltip } from '@trezor/components';

type AddedBadgeProps = {
    children: React.ReactNode;
};

export const AddedBadge = ({ children }: AddedBadgeProps) => (
    <Tooltip content="Added in version">
        <Badge intent="brand" size="small" iconLeft="plus">
            {children}
        </Badge>
    </Tooltip>
);
