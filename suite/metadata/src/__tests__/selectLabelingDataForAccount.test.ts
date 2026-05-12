import { type MetadataState } from '@suite-common/metadata-types';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { DEFAULT_ACCOUNT_METADATA, ENCRYPTION_VERSION } from '../metadataLabelingConstants';
import { selectLabelingDataForAccount } from '../metadataReducer';

const makeAccount = (key: string, fileName?: string): Account =>
    ({
        key,
        metadata: fileName
            ? {
                  [ENCRYPTION_VERSION]: {
                      fileName,
                      aesKey: 'aes',
                      fileNameHmac: 'hmac',
                      key: 'k',
                  },
              }
            : {},
    }) as unknown as Account;

const makeState = (accounts: Account[], providerData: Record<string, unknown>) =>
    ({
        metadata: {
            providers: [
                {
                    clientId: 'provider-1',
                    data: providerData,
                    type: 'dropbox',
                },
            ],
            selectedProvider: { labels: 'provider-1' },
        } as unknown as MetadataState,
        wallet: { accounts },
    }) as Parameters<typeof selectLabelingDataForAccount>[0];

describe('selectLabelingDataForAccount memoization', () => {
    it('returns the same labels object reference across calls when state is unchanged', () => {
        const state = makeState([makeAccount('acc1', 'file1.mtdt')], {
            'file1.mtdt': { accountLabel: 'My BTC', addressLabels: {}, outputLabels: {} },
        });

        const first = selectLabelingDataForAccount(state, 'acc1' as AccountKey);
        const second = selectLabelingDataForAccount(state, 'acc1' as AccountKey);

        expect(first).toBe(second);
        expect(first.accountLabel).toBe('My BTC');
    });

    it('returns the DEFAULT_ACCOUNT_METADATA singleton across calls when account has no labeling metadata', () => {
        const state = makeState([makeAccount('acc1')], {});

        const first = selectLabelingDataForAccount(state, 'acc1' as AccountKey);
        const second = selectLabelingDataForAccount(state, 'acc1' as AccountKey);

        expect(first).toBe(DEFAULT_ACCOUNT_METADATA);
        expect(first).toBe(second);
    });

    it('returns the DEFAULT_ACCOUNT_METADATA singleton when accountKey does not match any account', () => {
        const state = makeState([makeAccount('acc1', 'file1.mtdt')], {
            'file1.mtdt': { accountLabel: 'My BTC' },
        });

        const result = selectLabelingDataForAccount(state, 'nonexistent' as AccountKey);

        expect(result).toBe(DEFAULT_ACCOUNT_METADATA);
    });

    it('caches distinct accountKey lookups independently against the same state', () => {
        const state = makeState(
            [makeAccount('acc1', 'file1.mtdt'), makeAccount('acc2', 'file2.mtdt')],
            {
                'file1.mtdt': { accountLabel: 'BTC label' },
                'file2.mtdt': { accountLabel: 'ETH label' },
            },
        );

        const first1 = selectLabelingDataForAccount(state, 'acc1' as AccountKey);
        const first2 = selectLabelingDataForAccount(state, 'acc2' as AccountKey);
        const second1 = selectLabelingDataForAccount(state, 'acc1' as AccountKey);
        const second2 = selectLabelingDataForAccount(state, 'acc2' as AccountKey);

        expect(first1).toBe(second1);
        expect(first2).toBe(second2);
        expect(first1).not.toBe(first2);
        expect(first1.accountLabel).toBe('BTC label');
        expect(first2.accountLabel).toBe('ETH label');
    });
});
