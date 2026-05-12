import { type MetadataState } from '@suite-common/metadata-types';
import { type Account } from '@suite-common/wallet-types';

import { ENCRYPTION_VERSION } from '../metadataLabelingConstants';
import { selectAccountLabelsLegacy } from '../metadataReducer';

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
    }) as Parameters<typeof selectAccountLabelsLegacy>[0];

describe('selectAccountLabelsLegacy memoization', () => {
    it('returns the same dict reference across calls when accounts and provider are unchanged', () => {
        const state = makeState(
            [makeAccount('acc1', 'file1.mtdt'), makeAccount('acc2', 'file2.mtdt')],
            {
                'file1.mtdt': { accountLabel: 'My BTC' },
                'file2.mtdt': { accountLabel: 'My ETH' },
            },
        );

        const first = selectAccountLabelsLegacy(state);
        const second = selectAccountLabelsLegacy(state);

        expect(first).toBe(second);
        expect(first).toEqual({ acc1: 'My BTC', acc2: 'My ETH' });
    });

    it('returns the same empty-dict reference across calls when no accounts have labeled metadata', () => {
        const state = makeState([makeAccount('acc1'), makeAccount('acc2')], {});

        const first = selectAccountLabelsLegacy(state);
        const second = selectAccountLabelsLegacy(state);

        expect(first).toBe(second);
        expect(first).toEqual({});
    });

    it('returns a new dict when the accounts array reference changes', () => {
        const account = makeAccount('acc1', 'file1.mtdt');
        const stateA = makeState([account], { 'file1.mtdt': { accountLabel: 'A' } });
        const first = selectAccountLabelsLegacy(stateA);

        const stateB = makeState([account, makeAccount('acc2', 'file2.mtdt')], {
            'file1.mtdt': { accountLabel: 'A' },
            'file2.mtdt': { accountLabel: 'B' },
        });
        const second = selectAccountLabelsLegacy(stateB);

        expect(first).not.toBe(second);
        expect(second).toEqual({ acc1: 'A', acc2: 'B' });
    });
});
