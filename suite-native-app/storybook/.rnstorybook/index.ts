import { createMMKV } from 'react-native-mmkv';

import { view } from './storybook.requires';

const mmkvStorage = createMMKV({
    id: 'storybook-ui-storage',
});

export const StorybookUI = view.getStorybookUI({
    storage: {
        setItem: (key, value) => {
            mmkvStorage.set(key, value);

            return Promise.resolve();
        },
        getItem: key => {
            const value = mmkvStorage.getString(key);

            return Promise.resolve(value ?? null);
        },
    },
});
