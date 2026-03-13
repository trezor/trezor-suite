import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { renderHook } from '@testing-library/react-native';

import { IntlProviderForTests } from '@suite-native/intl';
import { NativeServicesProvider } from '@suite-native/services';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { extraDependenciesNativeMock } from '@suite-native/test-utils/src/extraDependenciesNative.mock';
import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

const renderHookWithProviders = <Result, Props>(callback: (props: Props) => Result) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <SafeAreaProvider>
                <IntlProviderForTests>
                    <StylesProvider theme={theme} renderer={renderer}>
                        <NavigationContainer>
                            <NativeServicesProvider services={extraDependenciesNativeMock.services}>
                                <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                            </NativeServicesProvider>
                        </NavigationContainer>
                    </StylesProvider>
                </IntlProviderForTests>
            </SafeAreaProvider>
        ),
    });

describe('with basic providers', () => {
    it('should render hook', () => {
        const { result } = renderHookWithProviders(() => true);

        expect(result.current).toBe(true);
    });
});
