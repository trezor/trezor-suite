import {
    type Evolu,
    NonEmptyString1000,
    type QueryRows,
    createIdFromString,
    createQueryBuilder,
    id,
    nullOr,
    object,
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

const walletTableColumns = {
    // This table will have only 1 record. As every wallet has its own secret, and therefore
    // its own Evolu instance. So the Wallets label will always be just single.
    id: WalletLabelId,
    walletDescriptor: NonEmptyString1000,
    label: nullOr(NonEmptyString1000),
};

export const WalletEvoluSchema = object(walletTableColumns);

export const WalletTableSchema = {
    wallet: walletTableColumns,
};

const createQuery = createQueryBuilder(WalletTableSchema);

export class EvoluWalletTable implements WalletTable {
    constructor(private evolu: Evolu<typeof WalletTableSchema>) {}

    private getQuery = () => createQuery(db => db.selectFrom('wallet').selectAll());

    update = ({ walletDescriptor, label }: SuiteSyncWallet) => {
        const idResult = WalletLabelId.from(createIdFromString(walletDescriptor));

        if (!idResult.ok) {
            return err(createSuiteSyncUpdateError(idResult.error));
        }

        const normalizedLabel = normalizeLabel(label);

        const validated = WalletEvoluSchema.from({
            id: createIdFromString(walletDescriptor),
            walletDescriptor,
            label: normalizedLabel,
        });

        if (!validated.ok) {
            return err(createSuiteSyncUpdateError({ caused: validated.error }));
        }

        this.evolu.upsert('wallet', validated.value);

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
