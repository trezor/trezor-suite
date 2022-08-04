// import React from 'react';
// import { Provider } from 'react-redux';

// import { configureStore, Store } from '@reduxjs/toolkit';

// import { render, waitFor, screen } from '@suite-native/test-utils';

import { transformFiatCurrencyToSelectItem } from '../CurrencySelector';
// import { appSettingsReducer } from '../../slice';

// const store: Store = configureStore({
//     reducer: {
//         appSettings: appSettingsReducer,
//     },
// });

// test('currency selector', async () => {
//     const { getByRole } = render(
//         <Provider store={store}>
//             <CurrencySelector />
//             ahoj
//         </Provider>,
//     );
//     screen.debug();
//     await waitFor(() => {
//         const select = getByRole('SelectTrigger');
//         expect(select).toBeTruthy();
//     });
//     // fireEvent.press(select);
// });

test('transformFiatCurrencyToSelectItem returns correct value', () => {
    expect(
        transformFiatCurrencyToSelectItem({ label: 'usd', value: 'United States Dollar' }),
    ).toEqual({ value: 'usd', label: 'United States Dollar' });
});
