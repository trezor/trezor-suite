import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import {
    type NetworkSymbol,
    type NetworkSymbolExtended,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { type AnonymitySet } from '@trezor/blockchain-link-types';
import { Column, Icon, Link, Row, Text, Tooltip } from '@trezor/components';
import { ChangeIcon, WalletIcon } from '@trezor/icons';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { UtxoAnonymity } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite/useSelector';

const OP_RETURN_REGEX = /^OP_RETURN \(([^)]+)\)/;

const ownershipIcon = {
    change: { icon: ChangeIcon, tooltip: 'TR_CHANGE_OUTPUT_TOOLTIP' },
    own: { icon: WalletIcon, tooltip: 'TR_OWN_ADDRESS_TOOLTIP' },
} as const;

export type AddressOwnership = keyof typeof ownershipIcon;

type IOItem = {
    anonymitySet?: AnonymitySet;
    networkSymbol: NetworkSymbol;
    symbol?: NetworkSymbolExtended;
    contractAddress?: string;
    value?: string;
    amount?: string | ReactNode;
    isPhishingTransaction?: boolean;
    ownership?: AddressOwnership;
};

export const IOItem = ({
    anonymitySet,
    value,
    networkSymbol,
    symbol,
    contractAddress,
    amount,
    isPhishingTransaction,
    ownership,
}: IOItem) => {
    const explorer = useSelector(state => selectExplorer(state, networkSymbol));
    const explorerUrl = getExplorerUrl(explorer, 'address');
    const explorerLink = useExternalLink(`${explorerUrl}${value}${explorer?.queryString ?? ''}`);
    const anonymity = value && anonymitySet?.[value];
    const isOpReturn = value?.startsWith('OP_RETURN ');

    return (
        <Text as="div" typographyStyle="body-sm">
            <Column alignItems="flex-start" overflow="hidden">
                {!isOpReturn ? (
                    <>
                        {value && (
                            <Row gap={6} alignItems="center">
                                <Link href={explorerLink}>
                                    <Address
                                        value={value}
                                        isTruncated
                                        data-testid="@tx-detail/txid-value"
                                        isCopyAllowed={!isPhishingTransaction}
                                    />
                                </Link>
                                {ownership && (
                                    <Tooltip
                                        content={
                                            <Translation id={ownershipIcon[ownership].tooltip} />
                                        }
                                        flex="none"
                                    >
                                        <Icon
                                            as={ownershipIcon[ownership].icon}
                                            size={16}
                                            intent="neutral"
                                            priority="secondary"
                                            data-testid={`@tx-detail/address-ownership/${ownership}`}
                                        />
                                    </Tooltip>
                                )}
                            </Row>
                        )}
                        <Row gap={8}>
                            {anonymity && <UtxoAnonymity anonymity={anonymity} />}
                            {amount &&
                                (typeof amount === 'string' && symbol ? (
                                    <Text intent="neutral" priority="secondary" as="div">
                                        <FormattedCryptoAmount
                                            value={
                                                isNetworkSymbol(symbol)
                                                    ? formatNetworkAmount(amount, symbol)
                                                    : amount
                                            }
                                            symbol={symbol}
                                            contractAddress={contractAddress}
                                        />
                                    </Text>
                                ) : (
                                    amount
                                ))}
                        </Row>
                    </>
                ) : (
                    <Column>
                        <Text>OP_RETURN</Text>
                        {value?.replace(OP_RETURN_REGEX, '$1') ?? ''}
                    </Column>
                )}
            </Column>
        </Text>
    );
};
