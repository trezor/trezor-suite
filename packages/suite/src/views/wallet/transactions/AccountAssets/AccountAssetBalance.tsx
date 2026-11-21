import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import {
    selectHomeAssetTotals,
    selectIsAssetTableRatePending,
    selectIsAssetTableTotalIncomplete,
    selectShownWalletAssetKeys,
} from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Column, Row, Skeleton, Text } from '@trezor/components';

import { NoRatesTooltip } from '#src/components/suite/Ticker/NoRatesTooltip';
import { useSelector } from '#src/hooks/suite/useSelector';
import { useAccountHeaderContext } from '#src/support/suite/AccountHeaderProvider';
import { HomeTotalBalance } from '#src/views/home/HomeBalance/HomeTotalBalance';

/** The line height of the total headline, so its placeholders keep the card from jumping. */
const TOTAL_HEIGHT = 56;

type AccountAssetBalanceProps = {
    accountKey: AccountKey;
};

/** What the account is worth in total, and how many assets make it up. */
export const AccountAssetBalance = ({ accountKey }: AccountAssetBalanceProps) => {
    const assetCount = useSelector(state => selectShownWalletAssetKeys(state, accountKey).length);
    const { fiatValue } = useSelector(state => selectHomeAssetTotals(state, accountKey));
    const isIncomplete = useSelector(state => selectIsAssetTableTotalIncomplete(state, accountKey));
    const isRatePending = useSelector(state => selectIsAssetTableRatePending(state, accountKey));
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const { balanceSectionRef } = useAccountHeaderContext();

    return (
        <Box flex="1" minWidth={280}>
            <Card height="100%" data-testid="@wallet/account-assets/balance">
                <Column gap={24} height="100%" justifyContent="space-between" alignItems="stretch">
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_ACCOUNT_ASSETS_BALANCE" />
                        </Text>
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            data-testid="@wallet/account-assets/count"
                        >
                            <Translation
                                id="TR_ACCOUNT_ASSETS_COUNT"
                                values={{ count: assetCount }}
                            />
                        </Text>
                    </Row>
                    <Column ref={balanceSectionRef} alignItems="flex-start">
                        {fiatValue !== undefined && (
                            <HomeTotalBalance
                                fiatValue={fiatValue}
                                isApproximate={isIncomplete}
                                data-testid="@wallet/account-assets/fiat-amount"
                            />
                        )}
                        {/* Nothing is priced yet: wait for a rate on its way, or say there is none. */}
                        {fiatValue === undefined && isRatePending && (
                            <Row data-testid="@wallet/account-assets/skeleton">
                                <Skeleton
                                    width={180}
                                    height={TOTAL_HEIGHT}
                                    animate={shouldAnimateSkeleton}
                                />
                            </Row>
                        )}
                        {fiatValue === undefined && !isRatePending && (
                            <Row
                                height={TOTAL_HEIGHT}
                                alignItems="flex-start"
                                data-testid="@wallet/account-assets/no-rate"
                            >
                                <NoRatesTooltip />
                            </Row>
                        )}
                    </Column>
                </Column>
            </Card>
        </Box>
    );
};
