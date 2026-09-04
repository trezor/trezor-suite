import { Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import { type Network } from '@suite-common/wallet-config';
import { type BlockchainRootState, selectBlockchainState } from '@suite-common/wallet-core';
import { getBlockchain } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    IconButton,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type ConnectionInfoButtonProps = {
    network: Network;
};

type InfoLineProps = {
    title: TxKeyPath;
    value?: string | number;
};

const InfoLine = ({ title, value }: InfoLineProps) => (
    <VStack spacing="sp2">
        <Text color="contentSecondary">
            <Translation id={title} />
        </Text>
        <Text>{value}</Text>
    </VStack>
);

export const ConnectionInfoButton = ({ network }: ConnectionInfoButtonProps) => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const { connected, url, blockHash, blockHeight, version } = useSelector(
        (state: BlockchainRootState) => getBlockchain(selectBlockchainState(state), network.symbol),
    );

    const openBottomSheet = () => {
        Keyboard.dismiss();
        openModal();
    };

    return (
        <>
            <IconButton
                iconName="info"
                intent="neutral"
                priority="secondary"
                size="medium"
                onPress={openBottomSheet}
            />
            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="moduleSettings.networkBackends.connectionInfo.title" />}
                isCloseDisplayed
            >
                <VStack marginHorizontal="sp8" spacing="sp16">
                    {connected ? (
                        <>
                            <InfoLine
                                title="moduleSettings.networkBackends.connectionInfo.connectedTo"
                                value={url}
                            />
                            <InfoLine
                                title="moduleSettings.networkBackends.connectionInfo.blockHash"
                                value={blockHash}
                            />
                            <InfoLine
                                title="moduleSettings.networkBackends.connectionInfo.blockHeight"
                                value={blockHeight}
                            />
                            <InfoLine
                                title="moduleSettings.networkBackends.connectionInfo.backendVersion"
                                value={version}
                            />
                        </>
                    ) : (
                        <Text>
                            <Translation
                                id="moduleSettings.networkBackends.connectionInfo.disconnected"
                                values={{ networkName: network.name }}
                            />
                        </Text>
                    )}
                </VStack>
            </BottomSheetModal>
        </>
    );
};
