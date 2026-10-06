import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { trackWrappedNativeTokenThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseRefreshWrappedNativeTokenOnFocusParams = {
    accountKey: AccountKey | undefined;
    isEnabled: boolean;
};

export const useRefreshWrappedNativeTokenOnFocus = ({
    accountKey,
    isEnabled,
}: UseRefreshWrappedNativeTokenOnFocusParams) => {
    const { dispatch } = useServices(injectDispatch);

    useFocusEffect(
        useCallback(() => {
            if (!isEnabled || !accountKey) {
                return;
            }

            void dispatch(trackWrappedNativeTokenThunk({ accountKey }));
        }, [accountKey, dispatch, isEnabled]),
    );
};
