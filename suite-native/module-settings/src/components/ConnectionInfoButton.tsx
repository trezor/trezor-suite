import { Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import { type BlockchainRootState, selectNetworkBlockchainInfo } from '@suite-common/wallet-core';
import {
    BottomSheetModal,
    IconButton,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type InfoLineProps = {
    title: TxKeyPath;
    value?: string | number;
};

const InfoLine = ({ title, value }: InfoLineProps) => (
    <VStack spacing="sp2">
        <Text color="textSubdued">
            <Translation id={title} />
        </Text>
        <Text>{value}</Text>
    </VStack>
);

export const ConnectionInfoButton = () => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const { connected, url, blockHash, blockHeight, version } = useSelector(
        (state: BlockchainRootState) => selectNetworkBlockchainInfo(state, 'btc'),
    );

    const openBottomSheet = () => {
        Keyboard.dismiss();
        openModal();
    };

    return (
        <>
            <IconButton
                colorScheme="tertiaryElevation0"
                size="medium"
                iconName="info"
                onPress={openBottomSheet}
            />
            <BottomSheetModal
                ref={bottomSheetRef}
                title={
                    <Translation id="moduleSettings.advanced.bitcoinBackends.connectionInfo.title" />
                }
                isCloseDisplayed
            >
                <VStack marginHorizontal="sp8" spacing="sp16">
                    {connected ? (
                        <>
                            <InfoLine
                                title="moduleSettings.advanced.bitcoinBackends.connectionInfo.connectedTo"
                                value={url}
                            />
                            <InfoLine
                                title="moduleSettings.advanced.bitcoinBackends.connectionInfo.blockHash"
                                value={blockHash}
                            />
                            <InfoLine
                                title="moduleSettings.advanced.bitcoinBackends.connectionInfo.blockHeight"
                                value={blockHeight}
                            />
                            <InfoLine
                                title="moduleSettings.advanced.bitcoinBackends.connectionInfo.backendVersion"
                                value={version}
                            />
                        </>
                    ) : (
                        <Text>
                            <Translation id="moduleSettings.advanced.bitcoinBackends.connectionInfo.disconnected" />
                        </Text>
                    )}
                </VStack>
            </BottomSheetModal>
        </>
    );
};
