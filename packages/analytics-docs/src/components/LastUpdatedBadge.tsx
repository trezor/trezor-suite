import { Badge, Tooltip } from '@trezor/components';

type LastUpdatedBadgeProps = {
    children: React.ReactNode;
};

export const LastUpdatedBadge = ({ children }: LastUpdatedBadgeProps) => {
    if (!children) return null;

    return (
        <Tooltip content="Last updated in version">
            <Badge intent="warning" size="small" iconLeft="arrowsClockwiseFilled">
                {children}
            </Badge>
        </Tooltip>
    );
};
