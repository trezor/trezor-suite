import { TradingCountryCode } from '@suite-common/trading';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithBasicProvider,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { TradingLocationFormType } from '../../types/tradingLocationForm';
import { useFormCountryCode } from '../useFormCountryCode';
import { useLocationForm } from '../useLocationForm';

describe('useFormCountryCode', () => {
    const renderLocationForm = () => renderHookWithStoreProviderAsync(() => useLocationForm());

    const renderUseFormCountryCode = (locationForm: TradingLocationFormType) =>
        renderHookWithBasicProvider(() => useFormCountryCode(), {
            wrapper: ({ children }) => <Form form={locationForm}>{children}</Form>,
        });

    it.each<TradingCountryCode>(['US', 'unknown'])(
        'should reflect country for %s',
        async country => {
            const { result: formResult } = await renderLocationForm();

            act(() => {
                formResult.current.setValue('country', {
                    value: country,
                    label: 'does not matter',
                });
            });
            const { result } = renderUseFormCountryCode(formResult.current);

            expect(result.current).toEqual(country);
        },
    );
});
