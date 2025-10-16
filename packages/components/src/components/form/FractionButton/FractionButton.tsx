import { Tooltip } from '../../Tooltip/Tooltip';
import { NewButton } from '../../buttons/NewButton/NewButton';

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
        <NewButton
            intent="neutral"
            type="button"
            size="small"
            isDisabled={isDisabled}
            priority="secondary"
            onClick={onClick}
        >
            {children}
        </NewButton>
    </Tooltip>
);
