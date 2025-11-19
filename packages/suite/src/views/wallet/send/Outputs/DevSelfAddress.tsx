import { Account } from '@suite-common/wallet-types';
import { getFirstFreshAddress, isUtxoBased } from '@suite-common/wallet-utils';
import { Badge, Button, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
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
            <Row gap={spacings.xs}>
                To myself
                <Badge intent="warning" size="small">
                    <Translation id="TR_DEBUG_ONLY" />
                </Badge>
            </Row>
        </Button>
    );
};
