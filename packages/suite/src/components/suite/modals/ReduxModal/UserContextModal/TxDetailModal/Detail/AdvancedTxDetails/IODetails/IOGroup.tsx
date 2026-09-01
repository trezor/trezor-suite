import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, createAccountKey } from '@suite-common/wallet-types';
import { Column, Icon, InfoSegments, Row, Text } from '@trezor/components';
import { ArrowRightIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { type IODetailsType } from './IODetailsType';
import { type AddressOwnership, IOItem } from './IOItem';

export type IOGroupProps = {
    tx: WalletAccountTransaction;
    tokenSymbol?: NetworkSymbolExtended;
    contractAddress?: string;
    inputs: IODetailsType[];
    outputs: IODetailsType[];
    hasHeadings?: boolean;
    isUtxoBased?: boolean;
    isPhishingTransaction?: boolean;
};

export const IOGroup = ({
    tx,
    tokenSymbol,
    contractAddress,
    inputs,
    outputs,
    hasHeadings = true,
    isUtxoBased = false,
    isPhishingTransaction,
}: IOGroupProps) => {
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const accountAddresses = account?.addresses;
    const accountDescriptor = account?.descriptor;

    const displaySymbol = tokenSymbol ?? tx.symbol;

    const ownershipByAddress = useMemo(() => {
        if (!accountAddresses) return undefined;

        const ownership = new Map<string, AddressOwnership>();
        accountAddresses.used.forEach(({ address }) => ownership.set(address, 'own'));
        accountAddresses.unused.forEach(({ address }) => ownership.set(address, 'own'));
        accountAddresses.change.forEach(({ address }) => ownership.set(address, 'change'));

        return ownership;
    }, [accountAddresses]);

    // Change counts only on an output; spent as an input it is just one of the account's addresses.
    // Address-based accounts have no change chain and need case-insensitive matching (EIP-55).
    const getOwnership = (address?: string, isOutput = false) => {
        if (!address) return undefined;

        if (!ownershipByAddress) {
            return address.toLowerCase() === accountDescriptor?.toLowerCase() ? 'own' : undefined;
        }

        const ownership = ownershipByAddress.get(address);

        return ownership === 'change' && !isOutput ? 'own' : ownership;
    };

    const anonymitySet = accountAddresses?.anonymitySet;
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;

    if (!hasInputs && !hasOutputs) return null;

    return (
        <Row gap={64} alignItems="stretch" justifyContent="space-between">
            {hasInputs && (
                <Column width="40%" flex="0 0 40%" gap={8}>
                    {hasHeadings && (
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Text typographyStyle="body-sm-strong" intent="neutral">
                                <Translation id="TR_INPUTS" />
                            </Text>
                            {isUtxoBased && inputs.length}
                        </InfoSegments>
                    )}

                    {inputs.map(input => (
                        <IOItem
                            key={`input-${input.n}`}
                            anonymitySet={anonymitySet}
                            networkSymbol={tx.symbol}
                            symbol={displaySymbol}
                            contractAddress={contractAddress}
                            value={input.addresses?.[0]}
                            amount={input.value}
                            isPhishingTransaction={isPhishingTransaction}
                            ownership={getOwnership(input.addresses?.[0])}
                        />
                    ))}
                </Column>
            )}
            {hasInputs && hasOutputs && (
                <Row alignSelf="center">
                    <Icon as={ArrowRightIcon} size={16} intent="neutral" priority="secondary" />
                </Row>
            )}
            {hasOutputs && (
                <Column width="40%" flex="0 0 40%" gap={8}>
                    {hasHeadings && (
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Text typographyStyle="body-sm-strong" intent="neutral">
                                <Translation id="TR_OUTPUTS" />
                            </Text>
                            {isUtxoBased && outputs.length}
                        </InfoSegments>
                    )}
                    {outputs.map(output => (
                        <IOItem
                            key={`output-${output.n}`}
                            anonymitySet={anonymitySet}
                            networkSymbol={tx.symbol}
                            symbol={displaySymbol}
                            contractAddress={contractAddress}
                            value={output.addresses?.[0]}
                            amount={output.value}
                            isPhishingTransaction={isPhishingTransaction}
                            ownership={getOwnership(output.addresses?.[0], true)}
                        />
                    ))}
                </Column>
            )}
        </Row>
    );
};
