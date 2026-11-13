import { type ComponentType } from 'react';

import { CapabilityLabel } from '@suite/intl';
import { useTransactionFacts } from '@suite-common/transaction-details';
import { type IconComponent, Row } from '@trezor/components';
import { GasPumpIcon, PencilIcon, ReceiptIcon, TagIcon } from '@trezor/icons';
import type { TransactionFactIcon } from '@trezor/network-module-suite-common-types';

import { type WalletAccountTransaction } from '#src/types/wallet';

import { TransactionFactValue } from './TransactionFactValue';
import { transactionFactsOverrides } from './transactionFactsOverrides';
import {
    type DefaultTransactionFactsProps,
    type TransactionFactsContext,
    type TransactionFactsOverrideProps,
} from './transactionFactsTypes';
import { TxDetailItem } from '../TxDetailItem';

const factIcons = {
    fee: ReceiptIcon,
    gas: GasPumpIcon,
    tag: TagIcon,
    note: PencilIcon,
    sequence: ReceiptIcon,
} as const satisfies Record<TransactionFactIcon, IconComponent>;

/** The facts every network gets unless the app overrides them, one row each. */
export const DefaultTransactionFacts = ({ facts, decorate }: DefaultTransactionFactsProps) =>
    facts.map(fact => {
        const decoration = decorate?.(fact);

        return (
            <TxDetailItem
                key={fact.id}
                label={<CapabilityLabel label={fact.label} />}
                icon={factIcons[fact.icon]}
            >
                {decoration ? (
                    <Row gap={4}>
                        <TransactionFactValue value={fact.value} />
                        {decoration}
                    </Row>
                ) : (
                    <TransactionFactValue value={fact.value} />
                )}
            </TxDetailItem>
        );
    });

type TransactionFactsProps = {
    tx: WalletAccountTransaction;
    isConfirmed: boolean;
    context: TransactionFactsContext;
};

// The registry is keyed by family id; a resolved network names its family as a plain string.
const overridesByFamily: Readonly<
    Partial<Record<string, ComponentType<TransactionFactsOverrideProps>>>
> = transactionFactsOverrides;

/** The network-specific rows of the transaction detail, rendered from the network's facts. */
export const TransactionFacts = ({ tx, isConfirmed, context }: TransactionFactsProps) => {
    const transactionFacts = useTransactionFacts({
        network: { symbol: tx.symbol },
        transaction: tx,
        isConfirmed,
    });

    if (transactionFacts === undefined) {
        return null;
    }

    const { family, facts } = transactionFacts;
    const Override = overridesByFamily[family];

    return Override ? (
        <Override facts={facts} context={context} DefaultFacts={DefaultTransactionFacts} />
    ) : (
        <DefaultTransactionFacts facts={facts} />
    );
};
