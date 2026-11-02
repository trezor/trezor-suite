import { asNetworkSymbol } from '@suite-common/wallet-config';
import { Text } from '@suite-native/atoms';
import { renderHookWithBasicProvider, renderWithBasicProvider } from '@suite-native/test-utils';

import { useHowStakeWorksPreset } from './stakePresets';
import { useHowYieldWorksPreset } from './yieldPresets';

const useRewardDescriptions = (apy: number | null) => {
    const staking = useHowStakeWorksPreset({
        symbol: asNetworkSymbol('eth'),
        apy,
        entryPeriodInDays: 1,
        unstakingPeriodInDays: 14,
    });
    const yieldPreset = useHowYieldWorksPreset({
        tokenSymbol: 'USDC',
        vaultTokenSymbol: 'steakUSDC',
        apy,
        onApyPress: () => {},
        wrappedNativeSymbol: null,
    });

    return {
        staking: staking.timelineSections
            .flatMap(section => section.items)
            .find(item => item.id === 'staking.third')?.description,
        yield: yieldPreset.timelineSections
            .flatMap(section => section.items)
            .find(item => item.id === 'deposit.third')?.description,
    };
};

describe('How earn works reward rates', () => {
    it.each([null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
        'shows a plain unavailable label for %p',
        async apy => {
            const { result } = await renderHookWithBasicProvider(() => useRewardDescriptions(apy));
            const { getByTestId } = await renderWithBasicProvider(
                <>
                    <Text testID="staking">{result.current.staking}</Text>
                    <Text testID="yield">{result.current.yield}</Text>
                </>,
            );

            expect(getByTestId('staking')).toHaveTextContent(/^N\/A$/);
            expect(getByTestId('yield')).toHaveTextContent(/^N\/A$/);
        },
    );

    it('formats a valid rate in both timelines', async () => {
        const { result } = await renderHookWithBasicProvider(() => useRewardDescriptions(2.11491));
        const { getByTestId } = await renderWithBasicProvider(
            <>
                <Text testID="staking">{result.current.staking}</Text>
                <Text testID="yield">{result.current.yield}</Text>
            </>,
        );

        expect(getByTestId('staking')).toHaveTextContent(/2\.11/);
        expect(getByTestId('yield')).toHaveTextContent(/2\.11/);
    });
});
