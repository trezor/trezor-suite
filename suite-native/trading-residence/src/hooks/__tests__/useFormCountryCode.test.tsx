import { type TradingCountryCode } from '@suite-common/trading';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithBasicProvider,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';

import { type TradingLocationFormType } from '../../types/tradingLocationForm';
import { useFormCountryCode } from '../useFormCountryCode';
import { useLocationForm } from '../useLocationForm';

describe('useFormCountryCode', () => {
    const renderLocationForm = () => renderHookWithStoreProvider(() => useLocationForm());

    const renderUseFormCountryCode = (locationForm: TradingLocationFormType) =>
        renderHookWithBasicProvider(() => useFormCountryCode(), {
            wrapper: ({ children }) => <Form form={locationForm}>{children}</Form>,
        });

    it.each<TradingCountryCode>(['US', 'unknown'])('should reflect country for %s', country => {
        const { result: formResult } = renderLocationForm();

        act(() => {
            formResult.current.setValue('country', {
                value: country,
                codeAlpha3: 'USA',
                flag: 'Flag',
                name: 'Country long name',
                label: 'Country label',
                shortLabel: 'Short label',
            });
        });
        const { result } = renderUseFormCountryCode(formResult.current);

        expect(result.current).toEqual(country);
    });
});
