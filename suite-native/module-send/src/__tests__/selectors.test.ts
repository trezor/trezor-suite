import { type FormState, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeSendRootState } from '@suite-native/transaction-management';

import { selectDestinationTagFromDraft } from '../selectors';

const createMockState = (
    overrides: Partial<NativeSendRootState['wallet']['send']> = {},
): NativeSendRootState => ({
    wallet: {
        send: {
            feeLevels: {},
            error: null,
            drafts: {},
            ...overrides,
        },
    },
});

const btcAccountKey = mockAccountKey({ symbol: 'btc', descriptor: 'btc0' });
const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth0' });

describe('send selectors', () => {
    describe('selectDestinationTagFromDraft', () => {
        it('should return destination tag when it exists in draft', () => {
            const mockDrafts = {
                [btcAccountKey]: {
                    destinationTag: '12345',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            // Cast mockDrafts to the correct type to satisfy FormState requirements
            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(state, btcAccountKey);

            expect(result).toBe('12345');
        });

        it('should return undefined when draft does not exist', () => {
            const state = createMockState();
            const result = selectDestinationTagFromDraft(state, btcAccountKey);

            expect(result).toBeUndefined();
        });

        it('should handle token contract parameter', () => {
            const mockDrafts = {
                [`${ethAccountKey}-0x1234567890123456789012345678901234567890`]: {
                    destinationTag: '67890',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(
                state,
                ethAccountKey,
                '0x1234567890123456789012345678901234567890' as TokenAddress,
            );

            expect(result).toBe('67890');
        });
    });
});
