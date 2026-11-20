import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';

import { SignVerifyCopyButton } from './SignVerifyCopyButton';

type SignVerifySubmittedAddressProps = {
    address: string;
};

export const SignVerifySubmittedAddress = ({ address }: SignVerifySubmittedAddressProps) => (
    <Input
        label={<Translation id="TR_ADDRESS" />}
        type="text"
        readOnly
        value={address}
        rightContent={
            <SignVerifyCopyButton value={address} data-testid="@sign-verify/copy-address" />
        }
        data-testid="@sign-verify/submitted-address"
    />
);
