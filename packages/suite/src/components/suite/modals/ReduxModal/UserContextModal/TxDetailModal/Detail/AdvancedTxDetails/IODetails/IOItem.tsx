import { ReactNode } from 'react';

import {
    NetworkSymbolExtended,
    getExplorerUrl,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { AnonymitySet } from '@trezor/blockchain-link-types';
import { Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { TxAddress } from 'src/components/suite/copy/TxAddress';
import { UtxoAnonymity } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite/useSelector';

type IOItem = {
    anonymitySet?: AnonymitySet;
    symbol?: NetworkSymbolExtended;
    contractAddress?: string;
    address?: string;
    amount?: string | ReactNode;
    isPhishingTransaction?: boolean;
    hideExplorerLink?: boolean;
};

export const IOItem = ({
    anonymitySet,
    address,
    symbol,
    contractAddress,
    amount,
    isPhishingTransaction,
    hideExplorerLink = false,
}: IOItem) => {
    const network = useSelector(state => state.wallet.selectedAccount.network);
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));
    const anonymity = address && anonymitySet?.[address];

    return (
        <Column>
            <TxAddress
                txAddress={address ?? ''}
                explorerUrl={hideExplorerLink ? undefined : getExplorerUrl(explorer, 'address')}
                explorerUrlQueryString={explorer?.queryString}
                shouldAllowCopy={!isPhishingTransaction}
            />
            <Text as="div" variant="tertiary" typographyStyle="label">
                <Row gap={spacings.xs}>
                    {anonymity && <UtxoAnonymity anonymity={anonymity} />}
                    {amount &&
                        (typeof amount === 'string' && symbol ? (
                            <FormattedCryptoAmount
                                value={
                                    isNetworkSymbol(symbol)
                                        ? formatNetworkAmount(amount, symbol)
                                        : amount
                                }
                                symbol={symbol}
                                contractAddress={contractAddress}
                            />
                        ) : (
                            amount
                        ))}
                </Row>
            </Text>
        </Column>
    );
};
