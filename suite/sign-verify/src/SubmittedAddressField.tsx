import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';

import { CopyFieldButton } from './CopyFieldButton';

type SubmittedAddressFieldProps = {
    address?: string;
    onCopy: (value: string) => void;
};

export const SubmittedAddressField = ({ address, onCopy }: SubmittedAddressFieldProps) => (
    <Input
        label={<Translation id="TR_ADDRESS" />}
        type="text"
        readOnly
        value={address ?? ''}
        rightContent={
            <CopyFieldButton
                onClick={() => onCopy(address || '')}
                data-testid="@sign-verify/copy-address"
            />
        }
        data-testid="@sign-verify/submitted-address"
    />
);
