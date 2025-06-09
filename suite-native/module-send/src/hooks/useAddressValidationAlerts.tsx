import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { RouteProp, useRoute } from '@react-navigation/native';
import { checkAddressCheckSum, toChecksumAddress } from 'web3-utils';

import { getNetworkType } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isAddressValid } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { SendStackParamList, SendStackRoutes } from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import TrezorConnect from '@trezor/connect';

import { TokenOfNetworkAlertBody } from '../components/TokenOfNetworkAlertContent';
import { getOutputFieldName } from '../utils';

type UseAddressValidationAlertsArgs = {
    inputIndex: number;
};

const CHECKSUM_LINK_URL = 'https://trezor.io/learn/a/evm-address-checksum-in-trezor-suite';

export const useAddressValidationAlerts = ({ inputIndex }: UseAddressValidationAlertsArgs) => {
    const {
        params: { tokenContract, accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const [wasAddressChecksummed, setWasAddressChecksummed] = useState(false);
    const [wasTokenAlertDisplayed, setWasTokenAlertDisplayed] = useState(
        G.isNullable(tokenContract),
    );
    const [wasContractAlertDisplayed, setWasContractAlertDisplayed] = useState(false);
    const { showAlert } = useAlert();

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const networkType = symbol ? getNetworkType(symbol) : null;

    const { watch, setValue } = useFormContext();

    const addressFieldName = getOutputFieldName(inputIndex, 'address');
    const addressValue = watch(addressFieldName);

    const isFilledValidAddress = addressValue && symbol && isAddressValid(addressValue, symbol);

    const convertAddressToChecksum = useCallback(() => {
        setValue(addressFieldName, toChecksumAddress(addressValue), {
            shouldValidate: true,
        });
        setWasAddressChecksummed(true);
    }, [addressFieldName, addressValue, setValue]);

    const handleAddressChecksum = useCallback(async () => {
        if (isFilledValidAddress && !checkAddressCheckSum(addressValue)) {
            const params = {
                descriptor: addressValue,
                coin: symbol,
            };

            const addressInfo = await TrezorConnect.getAccountInfo(params);

            if (addressInfo.success) {
                // Already used addresses are checksumed without displaying the alert.
                const isUsedAddress = addressInfo.payload.history.total !== 0;
                if (isUsedAddress) {
                    convertAddressToChecksum();

                    return;
                }
            }

            showAlert({
                title: <Translation id="moduleSend.outputs.recipients.checksum.alert.title" />,
                description: (
                    <Translation
                        id="moduleSend.outputs.recipients.checksum.alert.body"
                        values={{
                            link: linkChunk => (
                                <Link
                                    href={CHECKSUM_LINK_URL}
                                    label={linkChunk}
                                    isUnderlined
                                    textColor="textSubdued"
                                />
                            ),
                        }}
                    />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSend.outputs.recipients.checksum.alert.primaryButton" />
                ),
                onPressPrimaryButton: convertAddressToChecksum,
            });
        }
    }, [addressValue, isFilledValidAddress, symbol, showAlert, convertAddressToChecksum]);

    const handleContractAddressCheck = useCallback(async () => {
        if (!isFilledValidAddress || !symbol || !networkType) return;

        if (networkType !== 'ethereum') return;

        const result = await TrezorConnect.getAccountInfo({
            descriptor: addressValue,
            coin: symbol,
        });

        if (!result?.success) {
            return;
        }
        const isContract = !!result.payload.misc?.contractInfo;

        if (isContract && !wasContractAlertDisplayed) {
            showAlert({
                title: <Translation id="moduleSend.outputs.recipients.smartContract.alert.title" />,
                description: (
                    <Translation id="moduleSend.outputs.recipients.smartContract.alert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSend.outputs.recipients.smartContract.alert.primaryButton" />
                ),
                onPressPrimaryButton: () => setWasContractAlertDisplayed(true),
            });
        }
    }, [
        addressValue,
        isFilledValidAddress,
        symbol,
        networkType,
        wasContractAlertDisplayed,
        showAlert,
    ]);

    useEffect(() => {
        const shouldShowTokenAlert =
            tokenContract && isFilledValidAddress && !wasTokenAlertDisplayed;
        const isAddressChecksumRequired =
            networkType === 'ethereum' &&
            isFilledValidAddress &&
            !checkAddressCheckSum(addressValue || '');
        const shouldChecksumAddress =
            isAddressChecksumRequired && !wasAddressChecksummed && wasTokenAlertDisplayed;
        const shouldCheckContractAddress =
            networkType === 'ethereum' &&
            isFilledValidAddress &&
            wasTokenAlertDisplayed &&
            !wasContractAlertDisplayed &&
            (!isAddressChecksumRequired || wasAddressChecksummed);

        if (shouldShowTokenAlert) {
            showAlert({
                appendix: (
                    <TokenOfNetworkAlertBody
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                onPressPrimaryButton: () => setWasTokenAlertDisplayed(true),
            });
        } else if (shouldChecksumAddress) {
            handleAddressChecksum();
        } else if (shouldCheckContractAddress) {
            handleContractAddressCheck();
        } else if (!isFilledValidAddress) {
            if (tokenContract) setWasTokenAlertDisplayed(false);
            setWasAddressChecksummed(false);
            setWasContractAlertDisplayed(false);
        }
    }, [
        isFilledValidAddress,
        showAlert,
        tokenContract,
        tokenSymbol,
        accountKey,
        networkType,
        wasAddressChecksummed,
        handleAddressChecksum,
        wasTokenAlertDisplayed,
        wasContractAlertDisplayed,
        handleContractAddressCheck,
        addressValue,
    ]);

    return { wasAddressChecksummed };
};
