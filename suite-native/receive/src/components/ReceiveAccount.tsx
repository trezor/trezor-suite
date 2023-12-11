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
import { ReceiveAddressCard } from './ReceiveAddressCard';
import { ReceiveAccountDetailsCard } from './ReceiveAccountDetailsCard';
import { hasReceiveAddressButtonRequest } from '../hooks/receiveSelectors';

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
    const hasReceiveButtonRequest = useSelector(hasReceiveAddressButtonRequest);

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address))
        return <ErrorMessage errorMessage={translate('generic.unknownError')} />;

    const handleShowAddressAndRemoveButtonRequests = async () => {
        await handleShowAddress();
        if (!device) return;
        dispatch(removeButtonRequests({ device }));
    };

    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceiveButtonRequest;

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
                    isReceiveApproved={isReceiveApproved}
                    isUnverifiedAddressRevealed={isUnverifiedAddressRevealed}
                    onShowAddress={handleShowAddressAndRemoveButtonRequests}
                />
            </VStack>

            {isConfirmOnTrezorReady && <ConfirmOnTrezorImage />}
        </Box>
    );
};
