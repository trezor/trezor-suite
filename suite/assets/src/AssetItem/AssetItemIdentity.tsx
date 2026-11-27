import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Row, Text } from '@trezor/components';
import { type NetworkConfigState } from '@trezor/network-module-types';
import { selectShouldShowNetworkIcon } from '@trezor/product-components';

import { AssetIcon } from '../AssetIcon';
import { AssetName } from '../AssetName';

export type AssetItemIdentityProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    badge?: ReactNode;
    showNetworkIcon?: boolean;
    'data-testid'?: string;
    isDisabled?: boolean;
};

export const AssetItemIdentity = ({
    networkSymbol,
    contractAddress,
    badge,
    showNetworkIcon,
    'data-testid': dataTestId,
    isDisabled,
}: AssetItemIdentityProps) => {
    const { NetworkNameFormatter } = useFormatters();
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const isIconFetchable = useSelector(
        (state: TokenDefinitionsRootState) =>
            contractAddress === undefined ||
            token?.isRecognized === true ||
            selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contractAddress),
    );
    const shouldShowNetworkIcon = useSelector(
        (state: NetworkConfigState) =>
            showNetworkIcon ??
            (!contractAddress ||
                selectShouldShowNetworkIcon(state, networkSymbol, contractAddress)),
    );

    return (
        <Row gap={12} overflow="hidden" flex="1" minWidth={0}>
            <AssetIcon
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                size={40}
                showNetworkIcon={shouldShowNetworkIcon}
                shouldTryToFetch={isIconFetchable}
            />
            <Column alignItems="flex-start" overflow="hidden" minWidth={0}>
                <Text
                    typographyStyle="body-md"
                    intent="neutral"
                    ellipsisLineCount={1}
                    maxWidth="100%"
                    isDisabled={isDisabled}
                    data-testid={dataTestId}
                >
                    <AssetName networkSymbol={networkSymbol} contractAddress={contractAddress} />
                </Text>
                <Row gap={8} maxWidth="100%">
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        ellipsisLineCount={1}
                        maxWidth="100%"
                        isDisabled={isDisabled}
                    >
                        <NetworkNameFormatter value={networkSymbol} />
                    </Text>
                    {badge}
                </Row>
            </Column>
        </Row>
    );
};
