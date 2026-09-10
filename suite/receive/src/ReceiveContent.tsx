import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Column, H2, Icon, Row, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

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

    const supportsTokens = useMemo(
        () => getNetworkFeatures(account.symbol).includes('tokens'),
        [account.symbol],
    );

    const networkName = getNetwork(account.symbol).name;
    const networkDisplaySymbol = getNetworkDisplaySymbol(account.symbol);

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
                            values={{ network: networkName }}
                        />
                    }
                    description={
                        <Translation
                            id="TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION"
                            values={{ network: networkName }}
                        />
                    }
                />
            )}

            <Row gap={4} alignItems="flex-start">
                <H2>
                    {supportsTokens ? (
                        <Translation id="RECEIVE_TITLE_ASSETS" values={{ network: networkName }} />
                    ) : (
                        <Translation id="RECEIVE_TITLE" values={{ networkDisplaySymbol }} />
                    )}
                </H2>
                {supportsTokens && (
                    <Tooltip
                        content={
                            <Translation
                                id="RECEIVE_ASSETS_TOOLTIP"
                                values={{
                                    networkDisplaySymbol,
                                    network: networkName,
                                }}
                            />
                        }
                    >
                        <Icon as={InfoIcon} size={16} intent="neutral" priority="secondary" />
                    </Tooltip>
                )}
            </Row>

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
