import { AssetTableRowProps } from './AssetRow';
import { Table } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { FiatValue, Translation } from 'src/components/suite';
import { EnhancedTokenInfo } from '@suite-common/token-definitions';
import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';

export const AssetTokenRow = ({
    assetTokensShownWithBalance,
    network,
    tokensDisplayFiatBalance,
}: {
    assetTokensShownWithBalance: EnhancedTokenInfo[];
    network: AssetTableRowProps['network'];
    tokensDisplayFiatBalance: string;
}) => {
    if (!assetTokensShownWithBalance?.length) return null;

    return (
        <Table.Row hasBorderTop={false}>
            <Table.Cell align="center">
                <Section $dashedLinePosition="topToMiddle">
                    <TokenIconSet
                        network={network.symbol}
                        tokens={assetTokensShownWithBalance ?? []}
                    />
                </Section>
            </Table.Cell>
            <Table.Cell padding={{ left: spacings.zero }}>
                <Translation id="TR_NAV_TOKENS" />
            </Table.Cell>
            <Table.Cell colSpan={4}>
                <FiatValue
                    amount={tokensDisplayFiatBalance ?? '0'}
                    symbol={network.symbol}
                    shouldConvert={false}
                />
            </Table.Cell>
        </Table.Row>
    );
};
