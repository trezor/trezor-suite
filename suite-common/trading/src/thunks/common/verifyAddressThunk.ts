import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { logErrorThunk } from './logErrorThunk';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingActiveSection } from '../../selectors/tradingSelectors';
import { getUnusedAddressFromAccount } from '../../utils';

export interface VerifyAddressThunk {
    account: Account;
    address: string | undefined;
    path: string | undefined;
}

export const verifyAddressThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/verifyAddress`,
    async ({ account, address, path }: VerifyAddressThunk, { dispatch, getState, extra }) => {
        const device = selectSelectedDevice(getState());
        const activeSection = selectTradingActiveSection(getState());

        if (!device) return;

        const accountAddress = getUnusedAddressFromAccount(account);
        address = address ?? accountAddress.address;
        path = path ?? accountAddress.path;

        if (!path || !address) return;

        dispatch(tradingActions.setModalAccountKey(account.key));

        if (activeSection === 'buy') {
            dispatch(tradingBuyActions.setTradingAccountKey(account.key));
        } else {
            dispatch(tradingExchangeActions.setReceiveAccountKey(account.key));
        }

        const addressDisplayType = extra.selectors.selectAddressDisplayType(getState());
        const { connected, available } = device;

        // Show warning when device is not connected
        if (!connected || !available) {
            dispatch(
                extra.actions.openModal({
                    type: 'unverified-address-proceed',
                    value: address,
                }),
            );

            return;
        }

        const params: Parameters<typeof confirmAddressOnDeviceThunk>[0] = {
            accountKey: account.key,
            addressPath: path,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        };

        const response = await dispatch(confirmAddressOnDeviceThunk(params)).unwrap();

        if (response.success) {
            dispatch(
                tradingActions.setVerifiedAddress({
                    address: response.payload.address,
                    path: params.addressPath,
                    mac: 'mac' in response.payload ? response.payload.mac : undefined,
                }),
            );
        } else {
            // special case: device no-backup permissions not granted
            if (response.error.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                logErrorThunk({
                    errorMessage: response.error.message,
                    tradingType: activeSection,
                    toastType: 'verify-address-error',
                }),
            );
        }
    },
);
