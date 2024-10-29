import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Icon, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { CoinBalance, HiddenPlaceholder, Translation, FiatValue } from 'src/components/suite';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';

const Section = styled.div<{ $renderBothRows: boolean }>`
    ${({ $renderBothRows }) => css`
        &::before {
            content: '';
            position: absolute;
            top: ${borders.widths.large};
            bottom: ${$renderBothRows ? '0px' : '50%'};
            left: 50%;
            transform: translateX(-50%);
            border-left: ${borders.widths.large} dotted ${({ theme }) => theme.borderDashed};
            z-index: -1;
        }
    `}
`;

export const AssetStakingRow = ({
    stakingTotalBalance,
    symbol,
    renderBothRows = false,
}: {
    stakingTotalBalance: string;
    symbol: NetworkSymbol;
    renderBothRows: boolean;
}) => {
    if (!stakingTotalBalance) return null;

    return (
        <Table.Row isBorderTop={false}>
            <Table.Cell align="center">
                <Section $renderBothRows={renderBothRows}>
                    <Icon name="piggyBankFilled" variant="tertiary" />
                </Section>
            </Table.Cell>
            <Table.Cell padding={{ left: spacings.zero }}>
                <Translation id="TR_NAV_STAKING" />
            </Table.Cell>
            <Table.Cell colSpan={4}>
                {stakingTotalBalance && !isTestnet(symbol) ? (
                    <Column alignItems="flex-start" justifyContent="center" gap={spacings.xxxs}>
                        <HiddenPlaceholder>
                            <FiatValue amount={stakingTotalBalance} symbol={symbol} />
                        </HiddenPlaceholder>
                        <HiddenPlaceholder>
                            <Text typographyStyle="hint" variant="tertiary">
                                <CoinBalance value={stakingTotalBalance} symbol={symbol} />
                            </Text>
                        </HiddenPlaceholder>
                    </Column>
                ) : (
                    <CoinBalance value={stakingTotalBalance} symbol={symbol} />
                )}
            </Table.Cell>
        </Table.Row>
    );
};
