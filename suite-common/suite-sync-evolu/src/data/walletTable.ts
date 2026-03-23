import {
    type Evolu,
    NonEmptyString1000,
    type QueryRows,
    createIdFromString,
    id,
    nullOr,
} from '@evolu/common';

import {
    type EntityListener,
    type SuiteSyncWallet,
    type WalletTable,
    createSuiteSyncUpdateError,
} from '@suite-common/suite-sync-storage';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { type UnwrapQuery } from '../evoluUtils';
import { normalizeLabel } from './normalizeLabel';

export const WalletLabelId = id('WalletLabelId');
export type WalletLabelId = typeof WalletLabelId.Type;

/**
 * IMPORTANT: Only additive changes allowed. Schema MUST BE always backwards
 *            compatible!
 */
export const WalletLabelSchema = {
    wallet: {
        // This table will have only 1 record. As every wallet has its own secret, and therefore
        // its own Evolu instance. So the Wallets label will always be just single.
        id: WalletLabelId,
        walletDescriptor: NonEmptyString1000,
        label: nullOr(NonEmptyString1000),
    },
};

export class EvoluWalletTable implements WalletTable {
    constructor(private evolu: Evolu<typeof WalletLabelSchema>) {}

    private getQuery = () => this.evolu.createQuery(db => db.selectFrom('wallet').selectAll());

    update = ({ walletDescriptor, label }: SuiteSyncWallet) => {
        const idResult = WalletLabelId.from(createIdFromString(walletDescriptor));

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const result = this.evolu.upsert('wallet', {
            id: idResult.value,
            walletDescriptor,
            label: normalizeLabel(label),
        });

        if (!result.ok) {
            return err(createSuiteSyncUpdateError(result.error));
        }

        return ok();
    };

    subscribe = ({ onChange }: EntityListener<SuiteSyncWallet>) => {
        const query = this.getQuery();

        const process = (labels: QueryRows<UnwrapQuery<typeof query>>) => {
            const acc: SuiteSyncWallet[] = [];

            for (const label of labels) {
                if (label.walletDescriptor === null) {
                    continue;
                }

                acc.push({
                    walletDescriptor: asWalletDescriptor(label.walletDescriptor),
                    label: label.label,
                });
            }

            if (acc.length > 0) {
                onChange(acc);
            }
        };

        const unsubscribe = this.evolu.subscribeQuery(query)(() => {
            const deviceLabels = this.evolu.getQueryRows(query);
            process(deviceLabels);
        });
        this.evolu.loadQuery(query).then(process);

        return unsubscribe;
    };
}
