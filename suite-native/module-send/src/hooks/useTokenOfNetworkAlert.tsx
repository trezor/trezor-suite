import { ReactNode, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useRoute, RouteProp } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { Box, VStack, Text, AlertBox } from '@suite-native/atoms';
import { SendStackParamList, SendStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { selectAccountTokenSymbol, TokensRootState } from '@suite-native/tokens';
import { CryptoIcon } from '@suite-native/icons';
import { useAlert } from '@suite-native/alerts';
import { useFormContext } from '@suite-native/forms';
import { isAddressValid } from '@suite-common/wallet-utils';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { getOutputFieldName } from '../utils';

type UseTokenOfNetworkAlertArgs = {
    inputIndex: number;
};

const iconWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'visible',
    height: 90,
    width: 90,
}));

const networkIconWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    padding: 3,
    borderRadius: utils.borders.radii.round,
    right: 0,
    bottom: 0,
    overflow: 'visible',
}));

type ParagraphProps = {
    header: ReactNode;
    body: ReactNode;
};

const Paragraph = ({ header, body }: ParagraphProps) => (
    <VStack spacing="sp4">
        <Text variant="highlight">{header}</Text>
        <Text color="textSubdued">{body}</Text>
    </VStack>
);

const TokenOfNetworkAlertBody = ({
    accountKey,
    tokenContract,
}: {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
}) => {
    const { applyStyle } = useNativeStyles();
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!tokenContract || !networkSymbol) return null;

    const networkName = getNetwork(networkSymbol).name;

    return (
        <VStack spacing="sp24">
            <Box style={applyStyle(iconWrapperStyle)}>
                <CryptoIcon symbol={tokenContract} size={80} />
                <Box style={applyStyle(networkIconWrapperStyle)}>
                    <CryptoIcon symbol={networkSymbol} size={32} />
                </Box>
            </Box>
            <Text variant="titleSmall">
                <Translation
                    id="moduleSend.outputs.tokenOfNetworkSheet.title"
                    values={{ tokenSymbol, networkName }}
                />
            </Text>
            <Paragraph
                header={
                    <Translation id="moduleSend.outputs.tokenOfNetworkSheet.body.self.subtitle" />
                }
                body={
                    <Translation
                        id="moduleSend.outputs.tokenOfNetworkSheet.body.self.text"
                        values={{ networkName }}
                    />
                }
            />
            <Paragraph
                header={
                    <Translation id="moduleSend.outputs.tokenOfNetworkSheet.body.outside.subtitle" />
                }
                body={
                    <Translation
                        id="moduleSend.outputs.tokenOfNetworkSheet.body.outside.text"
                        values={{ networkName }}
                    />
                }
            />
            <AlertBox
                title={
                    <Text variant="callout" color="textDefault">
                        <Translation id="moduleSend.outputs.tokenOfNetworkSheet.warning" />
                    </Text>
                }
                variant="warning"
                borderRadius="r12"
            />
        </VStack>
    );
};

export const useTokenOfNetworkAlert = ({ inputIndex }: UseTokenOfNetworkAlertArgs) => {
    const wasAlertShown = useRef(false);
    const { showAlert } = useAlert();
    const {
        params: { tokenContract, accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { watch } = useFormContext();

    const addressValue = watch(getOutputFieldName(inputIndex, 'address'));

    const isFilledValidAddress =
        addressValue && networkSymbol && isAddressValid(addressValue, networkSymbol);

    useEffect(() => {
        if (tokenContract && isFilledValidAddress && !wasAlertShown.current) {
            showAlert({
                appendix: (
                    <TokenOfNetworkAlertBody
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            });
            wasAlertShown.current = true;
        }
    }, [isFilledValidAddress, showAlert, tokenContract, tokenSymbol, accountKey]);
};
