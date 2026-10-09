import { Translation } from '@suite/intl';
import { selectSmallBalanceSummary } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

export const HomeAssetSmallBalancesLabel = () => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const smallBalances = useSelector(selectSmallBalanceSummary);

    return (
        <Column gap={2} alignItems="flex-start">
            <Translation id="TR_HOME_ASSET_SMALL_BALANCES" />
            {smallBalances !== undefined && (
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_HOME_ASSET_SMALL_BALANCES_SUMMARY"
                        values={{ count: smallBalances.assetCount }}
                    />
                    {' · '}
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(smallBalances.fiatValue)}
                    />
                </Text>
            )}
        </Column>
    );
};
