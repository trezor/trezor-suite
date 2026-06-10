import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { localeInitialState } from '@suite-native/intl';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

const renderHookWithExperimentProvider = <Result, Props>(callback: (props: Props) => Result) =>
    renderHookWithStoreProvider<Result, Props>(callback, {
        preloadedState: {
            featureFlags: featureFlagsInitialState,
            locale: localeInitialState,
            messageSystem: messageSystemInitialState,
            suiteSync: initialSuiteSyncState,
            suiteSyncData: initialSuiteSyncDataState,
        },
    });

describe('with basic providers', () => {
    it('should render hook', () => {
        const { result } = renderHookWithExperimentProvider(() => true);

        expect(result.current).toBe(true);
    });
});
