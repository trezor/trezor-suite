import { useDispatch, useSelector } from 'react-redux';

import { selectHasRunningDiscovery, startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type NativeAccountsRootState,
    selectIsAccountDiscoveryFailed,
} from '@suite-native/accounts';
import { BannerFull } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

type AccountDiscoveryFailedBannerProps = {
    accountKey: AccountKey;
};

export const AccountDiscoveryFailedBanner = ({ accountKey }: AccountDiscoveryFailedBannerProps) => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const isDiscoveryFailed = useSelector((state: NativeAccountsRootState) =>
        selectIsAccountDiscoveryFailed(state, accountKey),
    );
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

    if (!isDiscoveryFailed) {
        return null;
    }

    return (
        <BannerFull
            marginHorizontal="sp16"
            intent="warning"
            title={translate('moduleAccountManagement.discoveryFailedBanner.title')}
            description={translate('moduleAccountManagement.discoveryFailedBanner.description')}
            primaryButtonLabel={translate(
                'moduleAccountManagement.discoveryFailedBanner.retryButton',
            )}
            onPressPrimaryButton={() => dispatch(startOrRestartDiscoveryThunk())}
            primaryButtonProps={{ isLoading: hasRunningDiscovery }}
        />
    );
};
