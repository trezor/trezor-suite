import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol, getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { subunitsToUnits } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    Button,
    HStack,
    Hint,
    Text,
    TextButton,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import {
    type CardanoTokenSendRootState,
    selectCardanoTokenSendMinAdaAmount,
    selectIsCardanoTokenSendAdaInsufficient,
} from '../selectors';

type CardanoTokenSendMinAdaAmountInfoProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const CardanoTokenSendMinAdaAmountInfo = ({
    accountKey,
    tokenContract,
}: CardanoTokenSendMinAdaAmountInfoProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const minAdaAmount = useSelector((state: CardanoTokenSendRootState) =>
        selectCardanoTokenSendMinAdaAmount(state, accountKey, tokenContract),
    );
    const isAdaInsufficient = useSelector((state: CardanoTokenSendRootState) =>
        selectIsCardanoTokenSendAdaInsufficient(state, accountKey, tokenContract),
    );

    if (!symbol || getNetworkType(symbol) !== 'cardano' || !tokenContract) return null;

    const networkDisplaySymbol = getNetworkDisplaySymbol(symbol);
    const minAdaAmountInUnits = minAdaAmount
        ? subunitsToUnits({ symbol, value: minAdaAmount }).toFixed()
        : null;

    return (
        <VStack spacing="sp4">
            <HStack justifyContent="space-between" alignItems="center">
                <TextButton
                    size="small"
                    iconRight="info"
                    onPress={openModal}
                    testID="@send/cardano-min-ada-amount-info"
                >
                    <Translation
                        id="moduleSend.outputs.recipients.cardano.tokenSendMinAdaAmount.title"
                        values={{ networkDisplaySymbol }}
                    />
                </TextButton>
                <ExactCryptoAmountFormatter
                    variant="body-sm"
                    color="contentSecondary"
                    value={minAdaAmountInUnits}
                    symbol={symbol}
                    isDiscreetText={false}
                />
            </HStack>
            <BottomSheetModal ref={bottomSheetRef}>
                <VStack spacing="sp24">
                    <VStack spacing="sp8">
                        <Text variant="headline-sm">
                            <Translation
                                id="moduleSend.outputs.recipients.cardano.tokenSendMinAdaAmount.title"
                                values={{ networkDisplaySymbol }}
                            />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation
                                id="moduleSend.outputs.recipients.cardano.tokenSendMinAdaAmount.description"
                                values={{ networkDisplaySymbol }}
                            />
                        </Text>
                    </VStack>
                    <Button onPress={closeModal}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheetModal>
            {isAdaInsufficient && (
                <Hint variant="error">
                    <Translation
                        id="moduleSend.outputs.recipients.cardano.tokenSendMinAdaAmount.notEnough"
                        values={{ networkDisplaySymbol }}
                    />
                </Hint>
            )}
        </VStack>
    );
};
