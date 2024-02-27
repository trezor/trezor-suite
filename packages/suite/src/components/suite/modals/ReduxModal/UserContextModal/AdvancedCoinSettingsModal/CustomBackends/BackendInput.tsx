import { Input, Spinner, Tooltip } from '@trezor/components';
import { Translation, StatusLight } from 'src/components/suite';

const ActiveStatus = (
    <Tooltip content={<Translation id="TR_ACTIVE" />}>
        <StatusLight variant="primary" />
    </Tooltip>
);

type BackendInputProps = {
    url: string;
    isActive: boolean;
    isLoading?: boolean;
    onRemove?: () => void;
};

export const BackendInput = ({ url, isActive, isLoading, onRemove }: BackendInputProps) => {
    const getInnerAddon = () => {
        if (isLoading) {
            return <Spinner size={18} />;
        }
        if (isActive) {
            return ActiveStatus;
        }

        return undefined;
    };

    return (
        <Input
            value={url}
            isDisabled
            showClearButton={onRemove && 'hover'}
            onClear={onRemove}
            innerAddon={getInnerAddon()}
        />
    );
};
