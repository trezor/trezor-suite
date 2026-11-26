import { TotalBalanceHeadline } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { toTokenSymbol } from '@suite-common/tokens';
import { Card, Column, Divider, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { YieldVaultDetailBalanceCardActions } from './YieldVaultDetailBalanceCardActions';
import { YieldVaultDetailBalanceCardPromo } from './YieldVaultDetailBalanceCardPromo';
import { useYieldVaultDetail } from './useYieldVaultDetail';

export const YieldVaultDetailBalanceCard = () => {
    const { CryptoAmountFormatter } = useFormatters();

    const { account, vault, receiptToken, fiatAmount, hasDepositableBalance } =
        useYieldVaultDetail();

    return (
        <Card paddingType="none">
            <Column width="100%" gap={16} padding={20}>
                <Column width="100%" gap={8}>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_YIELD_VAULT_DETAIL_TOKEN_BALANCE" />
                    </Text>

                    <TotalBalanceHeadline
                        fiatValue={fiatAmount ?? undefined}
                        fallback={<Translation id="TR_EARN_N_A" />}
                        typographyStyle="headline-lg"
                    />

                    <Row alignItems="center" gap={6}>
                        <TokenIcon
                            networkSymbol={account.symbol}
                            contractAddress={receiptToken.vaultToken?.address}
                            size={20}
                            isBordered={false}
                            isTransparent={true}
                            wrappedTokenIcon="network"
                        />

                        <HiddenPlaceholder>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <CryptoAmountFormatter
                                    value={receiptToken.balance}
                                    symbol={toTokenSymbol(receiptToken.symbol)}
                                    isBalance
                                    tokenDecimals={receiptToken.decimals}
                                    formatStyle="compact-balance"
                                />
                            </Text>
                        </HiddenPlaceholder>
                    </Row>
                </Column>

                <YieldVaultDetailBalanceCardActions />
            </Column>

            {hasDepositableBalance && vault.status.enter && (
                <>
                    <Divider margin={0} />

                    <YieldVaultDetailBalanceCardPromo />
                </>
            )}
        </Card>
    );
};
