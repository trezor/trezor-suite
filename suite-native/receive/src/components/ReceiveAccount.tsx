import { useDispatch, useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { ErrorMessage, VStack, Box } from '@suite-native/atoms';
import {
    AccountsRootState,
    removeButtonRequests,
    selectAccountByKey,
    selectDevice,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';

import { useAccountReceiveAddress } from '../hooks/useAccountReceiveAddress';
import { ConfirmOnTrezorImage } from './ConfirmOnTrezorImage';
import { ReceiveAddressCard } from './ReceiveAddressCard/ReceiveAddressCard';
import { ReceiveAccountDetailsCard } from './ReceiveAccountDetailsCard';
import { useReceiveProgressSteps } from '../hooks/useReceiveProgressSteps';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAccount = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectDevice);

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const { receiveProgressStep, isConfirmOnTrezorReady } = useReceiveProgressSteps({
        isUnverifiedAddressRevealed,
        isReceiveApproved,
    });

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address))
        return <ErrorMessage errorMessage={translate('generic.unknownError')} />;

    const handleShowAddressAndRemoveButtonRequests = async () => {
        await handleShowAddress();
        if (!device) return;
        dispatch(removeButtonRequests({ device }));
    };

    return (
        <Box flex={1}>
            <VStack spacing={12}>
                {isAccountDetailVisible && (
                    <ReceiveAccountDetailsCard
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                )}
                <ReceiveAddressCard
                    networkSymbol={account.symbol}
                    address={address}
                    isEthereumTokenAddress={!!tokenContract}
                    onShowAddress={handleShowAddressAndRemoveButtonRequests}
                    receiveProgressStep={receiveProgressStep}
                />
            </VStack>

            {isConfirmOnTrezorReady && <ConfirmOnTrezorImage />}
        </Box>
    );
};
