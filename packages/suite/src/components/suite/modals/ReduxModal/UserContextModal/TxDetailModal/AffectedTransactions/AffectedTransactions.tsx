import { ChainedTransactions } from '@suite-common/wallet-types';
import { Banner, Card, Column, Divider, Link, Row, Table, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

import { AffectedTransactionItem } from './AffectedTransactionItem';

type AffectedTransactionsProps = {
    chainedTxs?: ChainedTransactions;
    showChained: () => void;
};

export const AffectedTransactions = ({ chainedTxs, showChained }: AffectedTransactionsProps) => {
    if (chainedTxs === undefined) {
        return null;
    }

    return (
        <Card fillType="flat" paddingType="none">
            <Row justifyContent="space-between" alignItems="center" padding={spacings.md}>
                <Text typographyStyle="body">
                    <Translation id="TR_CHAINED_TXS" />
                </Text>
                <Text variant="primary" typographyStyle="hint">
                    <Link onClick={showChained} icon="arrowUpRight" variant="nostyle">
                        <Translation id="TR_SEE_DETAILS" />
                    </Link>
                </Text>
            </Row>
            <Divider margin={spacings.zero} />
            <Column padding={spacings.md} gap={spacings.md}>
                <Banner variant="warning">
                    <Translation id="TR_AFFECTED_TXS" />
                </Banner>
                <Table>
                    <Table.Body>
                        {chainedTxs.own.map(tx => (
                            <Table.Row key={tx.txid}>
                                <Table.Cell>
                                    <AffectedTransactionItem tx={tx} isAccountOwned />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                        {chainedTxs.others.map(tx => (
                            <Table.Row key={tx.txid}>
                                <Table.Cell>
                                    <AffectedTransactionItem tx={tx} />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </Column>
        </Card>
    );
};
