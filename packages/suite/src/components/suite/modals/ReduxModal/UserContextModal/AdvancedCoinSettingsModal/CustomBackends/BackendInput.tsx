import { Input, Tooltip } from '@trezor/components';
import { Translation, StatusLight } from 'src/components/suite';

const InputAddon = (
    <Tooltip content={<Translation id="TR_ACTIVE" />}>
        <StatusLight status="ok" />
    </Tooltip>
);

type BackendInputProps = {
    url: string;
    active: boolean;
    onRemove?: () => void;
};

export const BackendInput = ({ url, active, onRemove }: BackendInputProps) => {
    const innerAddon = active ? InputAddon : undefined;
    const showClearButton = onRemove ? 'hover' : undefined;

    return (
        <Input
            value={url}
            isDisabled
            showClearButton={showClearButton}
            onClear={onRemove}
            innerAddon={innerAddon}
        />
    );
};
