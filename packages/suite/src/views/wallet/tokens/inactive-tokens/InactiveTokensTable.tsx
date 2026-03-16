import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { type Account, type SelectedAccountLoaded } from '@suite-common/wallet-types';
import type { TokenDetailByMint, TokenInfo } from '@trezor/blockchain-link-types';
import { STELLAR_DECIMALS, getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import { Button, Card, Row, Table, Text, Tooltip } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Loading } from 'src/components/suite';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useDispatch } from 'src/hooks/suite';

import { NoTokens } from '../common/NoTokens';
import { NoSearchResultsWrapped } from '../common/TokensTable/TokensTable';

const DashedTextWrapper = styled.div`
    border-bottom: 1px dashed;
    border-color: ${({ theme }) => `${theme.textSubdued}50`}; /* 50 is hex for ~30% opacity */
    cursor: pointer;
    display: inline-block;
`;

const DashedText = ({ children, ...props }: React.ComponentProps<typeof Text>) => (
    <DashedTextWrapper>
        <Text {...props}>{children}</Text>
    </DashedTextWrapper>
);

interface StellarTokenInfo extends TokenInfo {
    homeDomain?: string;
    rating?: number;
}

/**
 * Get the list of inactive Stellar tokens for the user account
 */
const getInactiveStellarTokens = async (account: Account): Promise<StellarTokenInfo[]> => {
    if (account.symbol !== 'xlm') return [];

    const allTokens: TokenDetailByMint = await getTokenMetadata();

    // Get the currently active token contract addresses for the user
    const activeTokenContracts = new Set(account.tokens?.map(token => token.contract) || []);

    // Return tokens that the user has not activated yet
    const inactiveTokens = Object.entries(allTokens)
        .filter(([contractAddress]) => !activeTokenContracts.has(contractAddress))
        .map(([contract]) => ({
            type: 'STELLAR-CLASSIC' as const,
            standard: 'STELLAR-CLASSIC' as const,
            contract,
            name: allTokens[contract]?.name,
            symbol: contract.split('-')[0],
            decimals: STELLAR_DECIMALS,
            homeDomain: allTokens[contract]?.home_domain,
            rating: allTokens[contract]?.rating,
        }))
        .sort((a, b) => {
            // Place tokens without ratings last, otherwise sort high to low
            if (a.rating == null && b.rating == null) return 0;
            if (a.rating == null) return 1;
            if (b.rating == null) return -1;

            return b.rating - a.rating;
        });

    return inactiveTokens;
};

interface InactiveTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const InactiveTokensTable = ({ selectedAccount, searchQuery }: InactiveTokensTableProps) => {
    const dispatch = useDispatch();
    const { account } = selectedAccount;
    const coingeckoId = getCoingeckoId(account.symbol);
    const [tokenToActivate, setTokenToActivate] = useState<StellarTokenInfo | null>(null);

    const {
        data: allInactiveTokens,
        isLoading,
        isError,
    } = useQuery({
        enabled: account.symbol === 'xlm',
        queryKey: desktopQueryKeys.inactiveTokens(account.symbol),
        queryFn: () => {
            try {
                return getInactiveStellarTokens(account);
            } catch (error) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'Failed to load inactive tokens. Please try again later.',
                    }),
                );
                throw error;
            }
        },
        initialData: [],
    });

    const filteredTokens = useMemo(() => {
        if (!searchQuery) {
            return allInactiveTokens;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();

        return allInactiveTokens.filter(
            token =>
                token.name?.toLowerCase().includes(lowerCaseQuery) ||
                token.contract.toLowerCase().includes(lowerCaseQuery),
        );
    }, [searchQuery, allInactiveTokens]);

    const handleActivateToken = (token: StellarTokenInfo) => {
        setTokenToActivate(token);
    };

    const closeActivateModal = () => setTokenToActivate(null);

    // Only show for Stellar network
    if (account.symbol !== 'xlm') {
        return <NoTokens title={<Translation id="TR_INACTIVE_TOKENS_EMPTY" />} />;
    }

    if (isLoading) {
        return <Loading />;
    }

    if (isError) {
        return <NoTokens title={<Translation id="TR_ERROR_LOADING_TOKENS" />} />;
    }

    if (filteredTokens.length === 0 && searchQuery) {
        return <NoSearchResultsWrapped />;
    }

    if (filteredTokens.length === 0) {
        return <NoTokens title={<Translation id="TR_INACTIVE_TOKENS_EMPTY" />} />;
    }

    return (
        <Card paddingType="none" overflow="hidden">
            <Table
                margin={{ top: spacings.xs }}
                colWidths={[
                    { minWidth: '200px', maxWidth: '250px' },
                    { minWidth: '140px', maxWidth: '250px' },
                ]}
                isRowHighlightedOnHover
            >
                <Table.Header>
                    <Table.Row>
                        <Table.Cell>
                            <Translation id="TR_TOKEN" />
                        </Table.Cell>
                        <Table.Cell>
                            <Translation id="TR_ISSUER" />
                        </Table.Cell>
                        <Table.Cell />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {filteredTokens.map(token => (
                        <Table.Row key={token.contract}>
                            <Table.Cell>
                                <Row gap={spacings.xs}>
                                    <AssetLogo
                                        coingeckoId={coingeckoId || ''}
                                        placeholder={token.name || token.symbol || ''}
                                        symbol={account.symbol}
                                        contractAddress={token.contract}
                                        size={24}
                                        shouldTryToFetch={true}
                                    />
                                    <Row gap={spacings.xs}>
                                        <Text typographyStyle="body-md">{token.name}</Text>
                                        <Text
                                            typographyStyle="body-md"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {token.symbol}
                                        </Text>
                                    </Row>
                                </Row>
                            </Table.Cell>
                            <Table.Cell>
                                <Tooltip
                                    content={
                                        <Text overflowWrap="break-word">
                                            <Translation id="TR_ISSUER_ADDRESS" />:<br />
                                            {token.contract.split('-')[1]}
                                        </Text>
                                    }
                                >
                                    <DashedText
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                    >
                                        {token.homeDomain || '-'}
                                    </DashedText>
                                </Tooltip>
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Button
                                    size="small"
                                    onClick={() => handleActivateToken(token)}
                                    data-testid={`@token/activate-${token.symbol}`}
                                >
                                    <Translation id="TR_ACTIVATE" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            {tokenToActivate && (
                <StellarManageTokenModal
                    mode="activate"
                    symbol={account.symbol}
                    contractAddress={tokenToActivate.contract}
                    onCancel={closeActivateModal}
                />
            )}
        </Card>
    );
};
