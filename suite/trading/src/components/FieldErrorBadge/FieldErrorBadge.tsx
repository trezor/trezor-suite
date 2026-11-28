import { Badge, type BadgeProps } from '@trezor/components';

type FieldErrorBadgeProps = Pick<BadgeProps, 'data-testid'> & {
    errorMessage: string | undefined;
};

export const FieldErrorBadge = ({
    errorMessage,
    'data-testid': dataTestId,
}: FieldErrorBadgeProps) => {
    if (!errorMessage) {
        return null;
    }

    return (
        <Badge intent="critical" size="small" data-testid={dataTestId}>
            {errorMessage}
        </Badge>
    );
};
