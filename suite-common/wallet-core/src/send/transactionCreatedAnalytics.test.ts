import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FormState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getTransactionCreatedEventPayload } from './transactionCreatedAnalytics';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    index: 2,
    accountType: 'segwit',
});

const precomposedForm: FormState = {
    ...DEFAULT_VALUES,
    options: ['broadcast'],
    outputs: [],
    selectedUtxos: [],
};

describe(getTransactionCreatedEventPayload.name, () => {
    it.each(['trade-cex', 'trade-dex'] as const)(
        'should include account index and type for %s',
        txType => {
            expect(
                getTransactionCreatedEventPayload({
                    action: 'sent',
                    account,
                    precomposedForm,
                    tokens: '',
                    txType,
                }),
            ).toMatchObject({ symbol: 'btc', txType, accountIndex: 2, accountType: 'segwit' });
        },
    );

    it.each(['stake', 'yield', undefined] as const)(
        'should not include account index and type for %s',
        txType => {
            const payload = getTransactionCreatedEventPayload({
                action: 'sent',
                account,
                precomposedForm,
                tokens: '',
                txType,
            });

            expect(payload).not.toHaveProperty('accountIndex');
            expect(payload).not.toHaveProperty('accountType');
        },
    );
});
