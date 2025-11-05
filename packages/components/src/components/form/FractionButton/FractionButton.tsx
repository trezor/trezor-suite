import { Tooltip } from '../../Tooltip/Tooltip';
import { Button } from '../../buttons/Button/Button';

export type FractionButtonProps = {
    id: string;
    children: React.ReactNode;
    tooltip?: React.ReactNode;
    isDisabled?: boolean;
    onClick: () => void;
};

export const FractionButton = ({
    id,
    children,
    tooltip,
    isDisabled,
    onClick,
}: FractionButtonProps) => (
    <Tooltip key={id} content={tooltip} cursor="pointer">
        <Button
            intent="neutral"
            type="button"
            size="small"
            isDisabled={isDisabled}
            priority="secondary"
            onClick={onClick}
        >
            {children}
        </Button>
    </Tooltip>
);
