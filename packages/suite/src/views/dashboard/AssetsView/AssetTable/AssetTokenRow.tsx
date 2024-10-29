import { AssetTableRowProps } from './AssetRow';
import { Table } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';
import { spacings, borders } from '@trezor/theme';
import { FiatValue, Translation } from 'src/components/suite';
import styled from 'styled-components';
import { EnhancedTokenInfo } from '@suite-common/token-definitions';

const Section = styled.div`
    &::before {
        content: '';
        position: absolute;
        top: ${borders.widths.large};
        bottom: 50%;
        left: 50%;
        transform: translateX(-50%);
        border-left: ${borders.widths.large} dotted ${({ theme }) => theme.borderDashed};
        z-index: -1;
    }
`;

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
                <Section>
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
