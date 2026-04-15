import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

type InstantlyAvailableRowProps = {
    accountKey: AccountKey;
    approximatedAmount: string | null;
};

export const InstantlyAvailableRow = ({
    accountKey,
    approximatedAmount,
}: InstantlyAvailableRowProps) => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;
    if (approximatedAmount === null) return null;
    if (new BigNumber(approximatedAmount).lte(0)) return null;

    const showInfoAlert = () =>
        showAlert({
            title: translate('earn.unstakeFlowScreen.instantlyAvailable.infoTitle'),
            description: translate('earn.unstakeFlowScreen.instantlyAvailable.infoDescription'),
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            onPressPrimaryButton: hideAlert,
        });

    return (
        <PressableOpacity onPress={showInfoAlert}>
            <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" spacing="sp8">
                    <Text variant="body-sm">
                        <Translation id="earn.unstakeFlowScreen.instantlyAvailable.label" />
                    </Text>
                    <Icon name="info" color="contentTertiary" size="medium" />
                </HStack>
                <HStack alignItems="center" spacing="sp4">
                    <CryptoIcon symbol={account.symbol} size="extraSmall" />
                    <CryptoAmountFormatter
                        decimals={2}
                        value={approximatedAmount}
                        symbol={account.symbol}
                        variant="body-sm"
                        color="contentPrimary"
                    />
                </HStack>
            </HStack>
        </PressableOpacity>
    );
};
