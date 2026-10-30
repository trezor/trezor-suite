import { useShouldRedactNumbers } from '@suite-common/discreet-mode';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { HStack } from '../Stack';
import { Text } from '../Text';
import { Discreet } from './Discreet';

describe('Discreet', () => {
    it('renders a placeholder immediately without waiting for layout or capture', async () => {
        const { getByTestId } = await renderWithStoreProvider(
            <Discreet isForcedDiscreetMode>
                <Text>### BTC</Text>
            </Discreet>,
        );

        expect(
            getByTestId('discreet-placeholder', { includeHiddenElements: true }),
        ).toBeOnTheScreen();
    });

    it('uses only the outer placeholder for nested discreet content', async () => {
        const { getAllByTestId, getByText } = await renderWithStoreProvider(
            <Discreet isForcedDiscreetMode>
                <Discreet>
                    <Text>### BTC</Text>
                </Discreet>
            </Discreet>,
        );

        expect(
            getAllByTestId('discreet-placeholder', { includeHiddenElements: true }),
        ).toHaveLength(1);
        expect(getByText('### BTC', { includeHiddenElements: true })).not.toBeVisible();
    });

    it.each([false, true])(
        'provides the redaction flag when privacy mode is %s',
        async isActive => {
            const { result } = await renderHookWithStoreProvider(() => useShouldRedactNumbers(), {
                wrapper: Discreet,
                preloadedState: { discreetMode: { isActive } },
            });

            expect(result.current).toBe(isActive);
        },
    );

    it('conceals composed children when forced despite privacy mode being off', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <Discreet isForcedDiscreetMode>
                <HStack>
                    <Text>1234567.89</Text>
                    <Text>BTC</Text>
                </HStack>
            </Discreet>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('1234567.89', { includeHiddenElements: true })).not.toBeVisible();
        expect(getByText('BTC', { includeHiddenElements: true })).not.toBeVisible();
        expect(queryByText('1234567.89')).toBeNull();
        expect(queryByText('BTC')).toBeNull();
    });

    it('shows composed children when discreet mode is off', async () => {
        const { getByText } = await renderWithStoreProvider(
            <Discreet>
                <HStack>
                    <Text>1</Text>
                    <Text>BTC</Text>
                </HStack>
            </Discreet>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('1')).toBeVisible();
        expect(getByText('BTC')).toBeVisible();
    });
});
