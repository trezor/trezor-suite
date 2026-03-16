import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    EarnProvider,
} from '@suite-common/suite-types/src/staking';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { Box, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { useAllYieldOpportunities } from 'src/components/earn/EarnDashboard/yield/hooks/useAllYieldOpportunities';
import { AccountLabel } from 'src/components/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch } from 'src/hooks/suite';

import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';

interface YieldPageHeaderProps {
    analyticsStep: Extract<EarnAnalyticsStep, 'yield-supply' | 'yield-withdraw'>;
}

export const YieldPageHeader = ({ analyticsStep }: YieldPageHeaderProps) => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const { yieldOpportunities } = useAllYieldOpportunities();
    const vault = routeParams
        ? yieldOpportunities.find(opportunity => opportunity.id === routeParams.yieldId)
        : undefined;
    const vaultName = vault?.metadata.name;
    const networkSymbol = account?.symbol;
    const assetLogo =
        vault?.token && networkSymbol
            ? {
                  coingeckoId: getCoingeckoId(networkSymbol) ?? vault.token.coinGeckoId,
                  placeholder: vault.token.symbol || vault.token.name || 'token',
                  contractAddress: vault.token.address ?? null,
              }
            : undefined;

    const onBackClick = () => {
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const onHowItWorksClick = () => {
        if (!account || !routeParams) {
            return;
        }

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Yield,
                provider: EarnProvider.YieldXyz,
                account,
                analyticsStep,
                actionType: 'close',
                yieldContext: {
                    id: routeParams.yieldId,
                    tokenContractAddress: vault?.token.address ?? undefined,
                },
            }),
        );
    };

    return (
        <PageHeader>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon="caretLeft"
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                />

                {vaultName ? (
                    <Row alignItems="center" gap={12} overflow="hidden">
                        {networkSymbol &&
                            (assetLogo?.coingeckoId ? (
                                <AssetLogo
                                    size={32}
                                    coingeckoId={assetLogo.coingeckoId}
                                    placeholder={assetLogo.placeholder}
                                    symbol={networkSymbol}
                                    contractAddress={assetLogo.contractAddress}
                                    showNetworkIcon
                                />
                            ) : (
                                <CoinLogo
                                    size={32}
                                    symbol={networkSymbol}
                                    type="tokenWithNetwork"
                                />
                            ))}
                        <Column gap={2} overflow="hidden">
                            <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                                {vaultName}
                            </Text>
                            {account && (
                                <AccountLabel
                                    account={account}
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                />
                            )}
                        </Column>
                    </Row>
                ) : (
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_EARN" />
                    </Text>
                )}

                <Box margin={{ left: 'auto' }}>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onHowItWorksClick}
                        isDisabled={!account || !routeParams}
                    >
                        <Translation id="TR_EARN_HOW_IT_WORKS" />
                    </Button>
                </Box>
            </Row>
        </PageHeader>
    );
};
