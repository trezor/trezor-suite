import { Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Network } from '@suite-common/wallet-config';

import { FiatValue, Translation } from 'src/components/suite';

import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';

interface AssetTokenProps {
    tokenIconSetWrapper: React.ReactNode;
    network: Network;
    tokensDisplayFiatBalance: string;
}

export const AssetTokenRow = ({
    tokenIconSetWrapper,
    network,
    tokensDisplayFiatBalance,
}: AssetTokenProps) => {
    if (!tokenIconSetWrapper) return null;

    return (
        <Table.Row hasBorderTop={false}>
            <Table.Cell align="center">
                <Section $dashedLinePosition="topToMiddle">{tokenIconSetWrapper}</Section>
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
