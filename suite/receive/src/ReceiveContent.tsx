import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Column, H2 } from '@trezor/components';

import { AddressHistory } from './AddressHistory';
import { NewestAddressCard } from './NewestAddressCard';
import { type ReceiveAmountComponent } from './receive';
import { useReceiveDisabled } from './useReceiveDisabled';
import { AddressCopiedModal } from './verification/AddressCopiedModal';
import { showAddressThunk } from './verification/showAddressThunk';

export type ReceiveContentProps = {
    account: Account;
    locked: boolean;
    AmountComponent: ReceiveAmountComponent;
};

export const ReceiveContent = ({ account, locked, AmountComponent }: ReceiveContentProps) => {
    const dispatch = useDispatch();
    const { isReceiveDisabled } = useReceiveDisabled();

    // Copying an address is the entry point to verification, so the cards report the copied path
    // here and the prompt offers to verify that exact address.
    const [promptedAddressPath, setPromptedAddressPath] = useState<string | undefined>();

    // Which address is being confirmed on the device, shared by the cards so the verifying button
    // shows a spinner while the others are disabled.
    const [verifyingAddressPath, setVerifyingAddressPath] = useState<string | undefined>();

    const disabled = locked || isReceiveDisabled;

    const handleVerifyAddress = async (path: string) => {
        if (verifyingAddressPath !== undefined) {
            return;
        }

        setVerifyingAddressPath(path);

        try {
            await dispatch(showAddressThunk({ path }));
        } finally {
            setVerifyingAddressPath(undefined);
        }
    };

    const dismissVerificationPrompt = () => setPromptedAddressPath(undefined);

    return (
        <Column gap={24} alignItems="stretch">
            {account.networkType === 'ethereum' && account.symbol !== 'eth' && (
                <Banner
                    icon
                    intent="info"
                    title={
                        <Translation
                            id="TR_EVM_EXPLANATION_TITLE"
                            values={{ network: getNetwork(account.symbol).name }}
                        />
                    }
                    description={
                        <Translation
                            id="TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION"
                            values={{ network: getNetwork(account.symbol).name }}
                        />
                    }
                />
            )}

            <H2>
                <Translation
                    id="RECEIVE_TITLE"
                    values={{ networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol) }}
                />
            </H2>

            <NewestAddressCard
                accountKey={account.key}
                disabled={disabled}
                verifyingAddressPath={verifyingAddressPath}
                onCopied={setPromptedAddressPath}
                onVerify={handleVerifyAddress}
            />

            <AddressHistory
                accountKey={account.key}
                disabled={disabled}
                verifyingAddressPath={verifyingAddressPath}
                AmountComponent={AmountComponent}
                onCopied={setPromptedAddressPath}
                onVerify={handleVerifyAddress}
            />

            <AddressCopiedModal
                addressPath={promptedAddressPath}
                isVerifying={
                    promptedAddressPath !== undefined &&
                    verifyingAddressPath === promptedAddressPath
                }
                onVerify={handleVerifyAddress}
                onDismiss={dismissVerificationPrompt}
            />
        </Column>
    );
};
