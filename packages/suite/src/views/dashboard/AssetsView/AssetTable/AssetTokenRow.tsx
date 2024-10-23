import { AssetTableRowProps } from './AssetRow';
import { Table } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';
import { FiatValue, Translation } from 'src/components/suite';
import styled from 'styled-components';
import { EnhancedTokenInfo } from '@suite-common/token-definitions';

const Section = styled.div`
    margin-left: ${spacingsPx.sm};

    &::before {
        content: '';
        position: absolute;
        top: 2px;
        bottom: 16px;
        left: 43.5px;
        border-left: 2px dotted ${({ theme }) => theme.borderDashed};
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
        <Table.Row isBorderTop={false}>
            <Table.Cell colSpan={1} padding={{ right: spacingsPx.xxs }}>
                <Section>
                    <TokenIconSet
                        network={network.symbol}
                        tokens={assetTokensShownWithBalance ?? []}
                    />
                </Section>
            </Table.Cell>
            <Table.Cell colSpan={2} padding={{ left: spacingsPx.zero }}>
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
