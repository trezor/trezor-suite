import { useState } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';

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
            <Button
                size="small"
                priority="secondary"
                intent="accentViolet"
                onClick={onSelectAddressClick}
            >
                Address book
            </Button>

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
