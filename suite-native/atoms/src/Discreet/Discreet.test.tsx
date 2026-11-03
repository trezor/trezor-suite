import { useShouldRedactNumbers } from '@suite-common/discreet-mode';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { HStack } from '../Stack';
import { Text } from '../Text';
import { Discreet } from './Discreet';

describe('Discreet', () => {
    it('uses only the outer blur for nested discreet content', async () => {
        const { getAllByTestId, getByText } = await renderWithStoreProvider(
            <Discreet isForcedDiscreetMode>
                <Discreet>
                    <Text>### BTC</Text>
                </Discreet>
            </Discreet>,
        );

        const boundaries = getAllByTestId('blur-native', { includeHiddenElements: true });
        expect(boundaries).toHaveLength(1);
        expect(boundaries[0]).toHaveProp('pointerEvents', 'none');
        expect(boundaries[0]).toHaveProp('accessibilityElementsHidden', true);
        expect(boundaries[0]).toHaveProp('importantForAccessibility', 'no-hide-descendants');
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

    it('blurs raw children without redacting them when forced', async () => {
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
        const { getByText, getByTestId } = await renderWithStoreProvider(
            <Discreet>
                <HStack>
                    <Text>1</Text>
                    <Text>BTC</Text>
                </HStack>
            </Discreet>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByTestId('blur-native')).toHaveProp('pointerEvents', 'auto');
        expect(getByTestId('blur-native')).toHaveProp('accessibilityElementsHidden', false);
        expect(getByTestId('blur-native')).toHaveProp('importantForAccessibility', 'auto');
        expect(getByText('1')).toBeVisible();
        expect(getByText('BTC')).toBeVisible();
    });
});
