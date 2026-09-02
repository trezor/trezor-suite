import { useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type EnhancedTokenInfo,
    type TokenManagementAction,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import {
    fetchAndUpdateAccountThunk,
    selectStellarContractTokens,
    stellarContractTokensActions,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Column, Row, Table, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { YieldBadge } from 'src/components/earn/YieldBadge/YieldBadge';
import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { BlurUrls } from '../BlurUrls';
import { TokenRowActions } from './TokenRowActions';
import { useTokenYieldBadge } from './hooks/useTokenYieldBadge';
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
    yieldOpportunities?: YieldDtoV2[];
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
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress),
    );
    const yieldBadge = useTokenYieldBadge({
        networkSymbol: account.symbol,
        token,
        accountTokens: account.tokens,
        type,
        yieldOpportunities,
    });

    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const watchedContracts = useSelector(state => selectStellarContractTokens(state, account.key));
    // A curated contract token was never added by the user, so there is nothing to remove — the
    // worker would surface it again on the next fetch. Only watched ones offer the action.
    const isRemovableContractToken =
        token.standard === 'STELLAR-CONTRACT' && watchedContracts.includes(token.contract);

    // A contract token is only watched locally — there is no trustline to close, so removing it
    // from the watch list is the whole operation and nothing has to be signed.
    const handleDeactivateToken = () => {
        if (token.standard !== 'STELLAR-CONTRACT') {
            setShowDeactivateModal(true);

            return;
        }

        if (!isRemovableContractToken) return;

        dispatch(
            stellarContractTokensActions.removeContractToken({
                accountKey: account.key,
                contract: token.contract,
            }),
        );
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    };

    const { address: unusedAddress } = getUnusedAddressFromAccount(account);

    if (!unusedAddress || !device) return null;

    return (
        <>
            <Table.Row isCollapsed={isCollapsed} data-testid={`@token-row/${token.symbol}`}>
                <Table.Cell>
                    <Row gap={8}>
                        <TokenIcon
                            placeholder={token.name || token.symbol || 'token'}
                            symbol={account.symbol}
                            contractAddress={token.contract}
                            size={24}
                            shouldTryToFetch={isTokenKnown}
                        />
                        {isTokenKnown ? token.name : <BlurUrls text={token.name} />}
                        {yieldBadge && (
                            <YieldBadge
                                apy={yieldBadge.apy}
                                variant={yieldBadge.hasVaultPosition ? 'active' : 'inactive'}
                                account={account}
                                vaultId={yieldBadge.vaultId}
                                analyticsFrom={
                                    type === 'defi' ? 'account-defi-tokens' : 'account-tokens'
                                }
                            />
                        )}
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
                        isRemovableContractToken={isRemovableContractToken}
                        onDeactivateToken={handleDeactivateToken}
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
