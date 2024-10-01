import { useMemo } from 'react';

import { ParsedURL } from 'expo-linking';

import TrezorConnect from '@trezor/connect';
import { DEEPLINK_VERSION } from '@trezor/connect/src/data/version';
import { TypedError, TrezorError } from '@trezor/connect/src/constants/errors';

type UseConnectParseParamsType =
    | {
          popupOptions: {
              method: string;
              params: any;
              callback: string;
          };
          parseParamsError: undefined;
      }
    | {
          popupOptions: undefined;
          parseParamsError: TrezorError;
      };

export const useConnectParseParams = (url: ParsedURL): UseConnectParseParamsType => {
    return useMemo(() => {
        const { queryParams, path } = url;
        const version = path && path.split('/').slice(-2, -1)[0];
        if (
            !queryParams?.method ||
            !queryParams?.params ||
            !queryParams?.callback ||
            typeof queryParams?.params !== 'string' ||
            typeof queryParams?.method !== 'string' ||
            typeof queryParams?.callback !== 'string' ||
            !TrezorConnect.hasOwnProperty(queryParams?.method)
        ) {
            return { parseParamsError: TypedError('Method_InvalidParameter') };
        }

        if (!version || parseInt(version) > DEEPLINK_VERSION) {
            return { parseParamsError: TypedError('Deeplink_VersionMismatch') };
        }

        const params = JSON.parse(queryParams.params);
        const { method: methodName, callback } = queryParams;

        return { popupOptions: { method: methodName, params, callback } };
    }, [url]);
};
