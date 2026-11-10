import { useState } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';

import { ReceiveAddressModal } from './ReceiveAddressModal/ReceiveAddressModal';
import { useSendFormContext } from '../../../../hooks/wallet';

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
                intent="explore"
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
