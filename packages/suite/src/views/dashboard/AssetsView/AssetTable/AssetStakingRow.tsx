import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Icon, Table } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import styled, { css } from 'styled-components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatValue } from 'src/components/suite';
import { Text } from '@trezor/components';

const Section = styled.div<{ $renderBothRows: boolean }>`
    margin-left: ${spacingsPx.sm};

    ${({ $renderBothRows }) => css`
        &::before {
            content: '';
            position: absolute;
            top: 2px;
            bottom: ${$renderBothRows ? '0px' : '30px'};
            left: 43.5px;
            border-left: 2px dotted ${({ theme }) => theme.borderDashed};
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
            <Table.Cell colSpan={3}>
                <Section $renderBothRows={renderBothRows}>
                    <Icon name="piggyBankFilled" variant="tertiary" />
                </Section>
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
