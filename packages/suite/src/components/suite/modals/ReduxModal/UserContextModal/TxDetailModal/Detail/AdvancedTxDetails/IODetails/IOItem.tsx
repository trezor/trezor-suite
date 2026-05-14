import { type ReactNode } from 'react';

import { type NetworkSymbolExtended, isNetworkSymbol } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { type AnonymitySet } from '@trezor/blockchain-link-types';
import { Column, Link, Row, Text } from '@trezor/components';

import { Address } from 'src/components/suite/Address';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { UtxoAnonymity } from 'src/components/wallet';
import { useExternalLink } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const OP_RETURN_REGEX = /^OP_RETURN \(([^)]+)\)/;

type IOItem = {
    anonymitySet?: AnonymitySet;
    symbol?: NetworkSymbolExtended;
    contractAddress?: string;
    value?: string;
    amount?: string | ReactNode;
    isPhishingTransaction?: boolean;
};

export const IOItem = ({
    anonymitySet,
    value,
    symbol,
    contractAddress,
    amount,
    isPhishingTransaction,
}: IOItem) => {
    const { network } = useSelector(selectFullSelectedAccount);
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));
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
                            <Link href={explorerLink}>
                                <Address
                                    value={value}
                                    isTruncated
                                    data-testid="@tx-detail/txid-value"
                                    isCopyAllowed={!isPhishingTransaction}
                                />
                            </Link>
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
