import React from 'react';
import { Input, Button, Tooltip } from '@trezor/components';
import { Translation, StatusLight } from '@suite-components';

const InputAddon = ({
    onRemove,
    active,
    inputHovered,
}: {
    onRemove?: () => void;
    active: boolean;
    inputHovered?: boolean;
}) => {
    if (onRemove && inputHovered)
        return <Button variant="tertiary" icon="CROSS" onClick={onRemove} />;
    if (active)
        return (
            <Tooltip content={<Translation id="TR_ACTIVE" />}>
                <StatusLight status="ok" />
            </Tooltip>
        );
    return null;
};

type BackendInputProps = {
    url: string;
    active: boolean;
    onRemove?: () => void;
};

export const BackendInput = ({ url, active, onRemove }: BackendInputProps) => (
    <Input
        value={url}
        noTopLabel
        isDisabled
        noError
        innerAddon={<InputAddon onRemove={onRemove} active={active} />}
    />
);
