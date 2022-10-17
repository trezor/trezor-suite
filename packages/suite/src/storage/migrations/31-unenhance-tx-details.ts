import type { DBMigration, DBWalletAccountTransactionCompatible } from './types';
import { toWei } from 'web3-utils';
import { networkAmountToSatoshi, amountToSatoshi } from '@suite-common/wallet-utils';
import { updateAll } from './utils';

const VERSION = 31;

const migrate: DBMigration = async ({ oldVersion, transaction }) => {
    if (oldVersion >= VERSION) return;

    await updateAll<'txs', DBWalletAccountTransactionCompatible>(
        transaction,
        'txs',
        ({ order, tx: origTx }) => {
            const unformat = (amount: string) => networkAmountToSatoshi(amount, origTx.symbol);
            const unformatIfDefined = (amount: string | undefined) =>
                amount ? unformat(amount) : amount;

            const unenhancedTx = {
                ...origTx,
                amount: unformat(origTx.amount),
                fee: unformat(origTx.fee),
                totalSpent: unformat(origTx.totalSpent),
                tokens: origTx.tokens.map(tok => ({
                    ...tok,
                    amount: amountToSatoshi(tok.amount, tok.decimals),
                })),
                targets: origTx.targets.map(target => ({
                    ...target,
                    amount: unformatIfDefined(target.amount),
                })),
                ethereumSpecific: origTx.ethereumSpecific
                    ? {
                          ...origTx.ethereumSpecific,
                          gasPrice: toWei(origTx.ethereumSpecific.gasPrice, 'gwei'),
                      }
                    : undefined,
                cardanoSpecific: origTx.cardanoSpecific
                    ? {
                          ...origTx.cardanoSpecific,
                          withdrawal: unformatIfDefined(origTx.cardanoSpecific.withdrawal),
                          deposit: unformatIfDefined(origTx.cardanoSpecific.deposit),
                      }
                    : undefined,
                details: origTx.details && {
                    ...origTx.details,
                    vin: origTx.details.vin.map(v => ({
                        ...v,
                        value: unformatIfDefined(v.value),
                    })),
                    vout: origTx.details.vout.map(v => ({
                        ...v,
                        value: unformatIfDefined(v.value),
                    })),
                    totalInput: unformat(origTx.details.totalInput),
                    totalOutput: unformat(origTx.details.totalOutput),
                },
            };

            return { order, tx: unenhancedTx };
        },
    );

    await updateAll(transaction, 'devices', device => {
        const { features } = device;

        device.firmwareType =
            features &&
            features.capabilities &&
            !features.capabilities.includes('Capability_Bitcoin_like')
                ? 'bitcoin-only'
                : 'regular';

        return device;
    });
};

export default migrate;
