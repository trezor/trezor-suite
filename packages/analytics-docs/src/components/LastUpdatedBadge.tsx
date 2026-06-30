import { Badge, Tooltip } from '@trezor/components';
import { ArrowsClockwiseFilledIcon } from '@trezor/icons';

type LastUpdatedBadgeProps = {
    children: React.ReactNode;
};

export const LastUpdatedBadge = ({ children }: LastUpdatedBadgeProps) => {
    if (!children) return null;

    return (
        <Tooltip content="Last updated in version">
            <Badge intent="warning" size="small" iconLeft={ArrowsClockwiseFilledIcon}>
                {children}
            </Badge>
        </Tooltip>
    );
};
