import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Icon, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue, CoinBalance, HiddenPlaceholder } from 'src/components/suite';

import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';

interface AssetStakingRowProps {
    stakingTotalBalance: string;
    symbol: NetworkSymbol;
    shouldRenderTokenRow: boolean;
}

export const AssetStakingRow = ({
    stakingTotalBalance,
    symbol,
    shouldRenderTokenRow,
}: AssetStakingRowProps) => {
    if (!stakingTotalBalance) return null;

    return (
        <Table.Row hasBorderTop={false}>
            <Table.Cell align="center">
                <Section $dashedLinePosition={shouldRenderTokenRow ? 'topToBottom' : 'topToMiddle'}>
                    <Icon name="piggyBankFilled" intent="neutral" priority="secondary" />
                </Section>
            </Table.Cell>
            <Table.Cell padding={{ left: spacings.zero }}>
                <Translation id="TR_NAV_STAKING" />
            </Table.Cell>
            <Table.Cell colSpan={4}>
                {stakingTotalBalance && (
                    <Column alignItems="flex-start" justifyContent="center" gap={spacings.xxxs}>
                        <HiddenPlaceholder>
                            <BaseCurrencyValue amount={stakingTotalBalance} symbol={symbol} />
                        </HiddenPlaceholder>
                        <HiddenPlaceholder>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <CoinBalance value={stakingTotalBalance} symbol={symbol} />
                            </Text>
                        </HiddenPlaceholder>
                    </Column>
                )}
            </Table.Cell>
        </Table.Row>
    );
};
