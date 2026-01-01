import { ChainedTransactions } from '@suite-common/wallet-types';
import { Banner, Card, Column, Row, Table, Text, TextButton } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

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
        <Card
            fillType="flat"
            paddingType="small"
            header={
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body">
                        <Translation id="TR_CHAINED_TXS" />
                    </Text>
                    <TextButton onClick={showChained} size="small" intent="brand" isUnderlined>
                        <Translation id="TR_SEE_DETAILS" />
                    </TextButton>
                </Row>
            }
        >
            <Column gap={spacings.md}>
                <Banner intent="warning">
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
