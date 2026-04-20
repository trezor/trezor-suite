import { useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    type EnhancedTokenInfo,
    type TokenManagementAction,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { type Network, getCoingeckoId } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Column, Row, Table, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useSelector } from 'src/hooks/suite';

import { BlurUrls } from '../BlurUrls';
import { TokenRowActions } from './TokenRowActions';
import type { TokensTableType } from './types';

type TokenRowProps = {
    type?: TokensTableType;
    account: Account;
    token: EnhancedTokenInfo;
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    isUnverifiedTable?: boolean;
    isCollapsed?: boolean;
    yieldOpportunities?: YieldDto[];
};

export const TokenRow = ({
    type = 'default',
    account,
    token,
    network,
    tokenStatusType,
    hideRates,
    isUnverifiedTable,
    isCollapsed,
    yieldOpportunities,
}: TokenRowProps) => {
    const device = useSelector(selectSelectedDevice);
    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress),
    );

    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const { address: unusedAddress } = getUnusedAddressFromAccount(account);
    const coingeckoId = getCoingeckoId(account.symbol);

    if (!unusedAddress || !device) return null;

    return (
        <>
            <Table.Row isCollapsed={isCollapsed}>
                <Table.Cell>
                    <Row gap={spacings.xs}>
                        <AssetLogo
                            coingeckoId={coingeckoId || ''}
                            placeholder={token.name || token.symbol || 'token'}
                            symbol={account.symbol}
                            contractAddress={token.contract}
                            size={24}
                            shouldTryToFetch={isTokenKnown}
                        />
                        {isTokenKnown ? token.name : <BlurUrls text={token.name} />}
                    </Row>
                </Table.Cell>

                <Table.Cell>
                    <Column alignItems="flex-start">
                        {!hideRates && (
                            <BaseCurrencyValue
                                amount={token.balance || ''}
                                symbol={network.symbol}
                                tokenAddress={token.contract as TokenAddress}
                                showLoadingSkeleton
                            />
                        )}
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {/* TODO(stellar): I think it would be better to display the asset code as a symbol. */}
                            <FormattedCryptoAmount
                                data-testid={`@token-row/${token.name}/crypto-amount`}
                                value={token.balance}
                                symbol={token.symbol}
                                contractAddress={token.contract}
                            />
                        </Text>
                    </Column>
                </Table.Cell>

                {!hideRates && (
                    <>
                        <Table.Cell align="end">
                            <PriceTicker
                                symbol={network.symbol}
                                contractAddress={token.contract as TokenAddress}
                                noEmptyStateTooltip
                            />
                        </Table.Cell>
                        {type !== 'defi' && (
                            <Table.Cell>
                                <TrendTicker
                                    symbol={network.symbol}
                                    contractAddress={token.contract as TokenAddress}
                                    noEmptyStateTooltip
                                />
                            </Table.Cell>
                        )}
                    </>
                )}

                <Table.Cell align="end">
                    <TokenRowActions
                        type={type}
                        token={token}
                        tokenStatusType={tokenStatusType}
                        account={account}
                        network={network}
                        yieldOpportunities={yieldOpportunities}
                        isUnverifiedTable={isUnverifiedTable}
                        setShowDeactivateModal={setShowDeactivateModal}
                    />
                </Table.Cell>
            </Table.Row>

            {showDeactivateModal && (
                <StellarManageTokenModal
                    mode="deactivate"
                    symbol={network.symbol}
                    contractAddress={token.contract}
                    tokenBalance={token.balance || '0'}
                    onCancel={() => setShowDeactivateModal(false)}
                />
            )}
        </>
    );
};
