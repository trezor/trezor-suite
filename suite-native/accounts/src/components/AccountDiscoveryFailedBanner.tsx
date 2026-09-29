import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectHasRunningDiscovery, startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { type NativeAccountsRootState, selectIsAccountDiscoveryFailed } from '../selectors';

type AccountDiscoveryFailedBannerProps = {
    accountKey: AccountKey;
};

export const AccountDiscoveryFailedBanner = ({ accountKey }: AccountDiscoveryFailedBannerProps) => {
    const { translate } = useTranslate();
    const { dispatch } = useServices(injectDispatch);

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
