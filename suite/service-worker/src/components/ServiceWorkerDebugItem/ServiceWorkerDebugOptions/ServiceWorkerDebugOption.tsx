import { Column, Switch, Text } from '@trezor/components';

type ServiceWorkerDebugOptionProps = {
    label: string;
    hint: string;
    isChecked: boolean;
    onChange: (isChecked: boolean) => void;
    'data-testid': string;
};

export const ServiceWorkerDebugOption = ({
    label,
    hint,
    isChecked,
    onChange,
    'data-testid': dataTestId,
}: ServiceWorkerDebugOptionProps) => (
    <Column gap={4} alignItems="flex-start">
        <Switch
            data-testid={dataTestId}
            size="small"
            label={label}
            isChecked={isChecked}
            onChange={onChange}
        />
        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
            {hint}
        </Text>
    </Column>
);
