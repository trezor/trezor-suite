import { Card } from '@trezor/components';

export type CardButtonProps = {
    onClick: () => void;
    children: React.ReactNode;
    'data-testid'?: string;
    isDisabled?: boolean;
};

export const CardButton = ({
    onClick,
    children,
    'data-testid': dataTestId,
    isDisabled = false,
}: CardButtonProps) => (
    <Card paddingType="small" onClick={isDisabled ? undefined : onClick} data-testid={dataTestId}>
        {children}
    </Card>
);
