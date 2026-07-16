import { useState } from 'react';

import { getFirstFreshAddress } from '@suite-common/address';
import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Button, ButtonGroup } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { ReceiveAddressModal } from './ReceiveAddressModal/ReceiveAddressModal';

type DevAddressBookProps = {
    account: Account;
    outputId: number;
};

// Debug helper to fill opened account address.
export const DevAddressBook = ({ account, outputId }: DevAddressBookProps) => {
    const { setValue, composeTransaction } = useSendFormContext();
    const inputName = `outputs.${outputId}.address` as const;
    const { symbol } = account;

    const [isReceiveAddressModalOpen, setIsReceiveAddressModalOpen] = useState(false);

    const fillSelfAddress = () => {
        const selfAddress = getFirstFreshAddress(account, [], [], isUtxoBased(account));
        if (selfAddress) {
            setValue(inputName, selfAddress.address, { shouldValidate: true, shouldDirty: true });
        }
    };

    const onSelectAddressClick = () => {
        setIsReceiveAddressModalOpen(true);
    };

    const onAddressSelect = (address: string) => {
        setValue(inputName, address, { shouldValidate: true, shouldDirty: true });
        setIsReceiveAddressModalOpen(false);
        composeTransaction(inputName);
    };

    return (
        <>
            <ButtonGroup size="small">
                <Button
                    size="small"
                    priority="secondary"
                    intent="accentViolet"
                    onClick={fillSelfAddress}
                >
                    To myself
                </Button>

                <Button
                    size="small"
                    priority="secondary"
                    intent="accentViolet"
                    onClick={onSelectAddressClick}
                >
                    Address book
                </Button>
            </ButtonGroup>

            {isReceiveAddressModalOpen && (
                <ReceiveAddressModal
                    symbol={symbol}
                    onAddressSelect={onAddressSelect}
                    onClose={() => setIsReceiveAddressModalOpen(false)}
                />
            )}
        </>
    );
};
