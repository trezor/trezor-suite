import { type Account } from '@suite-common/wallet-types';
import { getFirstFreshAddress, isUtxoBased } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useSendFormContext } from 'src/hooks/wallet';

type DevSelfAddressProps = {
    account: Account;
    outputId: number;
};

// Debug helper to fill opened account address.
export const DevSelfAddress = ({ account, outputId }: DevSelfAddressProps) => {
    const { setValue } = useSendFormContext();
    const inputName = `outputs.${outputId}.address` as const;

    const fillSelfAddress = () => {
        const selfAddress = getFirstFreshAddress(account, [], [], isUtxoBased(account));
        if (selfAddress) {
            setValue(inputName, selfAddress.address, { shouldValidate: true });
        }
    };

    return (
        <Button size="small" priority="secondary" intent="neutral" onClick={fillSelfAddress}>
            <DebugOnlyBadge>To myself</DebugOnlyBadge>
        </Button>
    );
};
