import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectPendingProposal,
    sessionProposalApproveThunk,
    sessionProposalRejectThunk,
} from '@suite-common/walletconnect';
import {
    AlertBox,
    Badge,
    Button,
    HStack,
    Image,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const WalletConnectSessionPopupScreen = () => {
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const pendingProposal = useSelector(selectPendingProposal);

    const handleAccept = () => {
        if (pendingProposal?.eventId) {
            dispatch(sessionProposalApproveThunk({ eventId: pendingProposal?.eventId }));
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };
    const handleReject = () => {
        if (pendingProposal?.eventId) {
            dispatch(sessionProposalRejectThunk({ eventId: pendingProposal?.eventId }));
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    content={
                        <Text>
                            <Translation id="moduleConnectPopup.walletConnect.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack spacing="sp24" alignItems="center">
                <Image
                    source={{ uri: pendingProposal?.params.proposer.metadata.icons[0] }}
                    width={80}
                    height={80}
                />
                <TitleHeader
                    title={pendingProposal?.params.proposer.metadata.name}
                    subtitle={pendingProposal?.params.proposer.metadata.url}
                    textAlign="center"
                />
                {!pendingProposal?.isScam && pendingProposal?.validation === 'VALID' && (
                    <Badge
                        icon="check"
                        variant="greenSubtle"
                        label={
                            <Translation id="moduleConnectPopup.walletConnect.serviceStatus.verified" />
                        }
                    />
                )}
                {!pendingProposal?.isScam && pendingProposal?.validation === 'UNKNOWN' && (
                    <Badge
                        icon="question"
                        variant="neutral"
                        label={
                            <Translation id="moduleConnectPopup.walletConnect.serviceStatus.unknown" />
                        }
                    />
                )}
                {(pendingProposal?.isScam || pendingProposal?.validation === 'INVALID') && (
                    <Badge
                        icon="warning"
                        variant="red"
                        label={
                            <Translation id="moduleConnectPopup.walletConnect.serviceStatus.dangerous" />
                        }
                    />
                )}

                <Text textAlign="center">
                    <Translation id="moduleConnectPopup.walletConnect.message" />
                </Text>

                {pendingProposal?.isScam && (
                    <AlertBox
                        variant="error"
                        title={<Translation id="moduleConnectPopup.walletConnect.errors.isScam" />}
                    />
                )}
                {pendingProposal?.validation === 'INVALID' && (
                    <AlertBox
                        variant="error"
                        title={
                            <Translation id="moduleConnectPopup.walletConnect.errors.unableToVerify" />
                        }
                    />
                )}

                {pendingProposal?.expired && (
                    <AlertBox
                        variant="warning"
                        title={
                            <Translation id="moduleConnectPopup.walletConnect.errors.requestExpired" />
                        }
                    />
                )}

                <HStack spacing="sp24" justifyContent="space-evenly">
                    <Button colorScheme="redElevation0" onPress={handleReject}>
                        <Translation id="generic.buttons.cancel" />
                    </Button>
                    <Button
                        colorScheme="primary"
                        onPress={handleAccept}
                        isDisabled={
                            !pendingProposal || pendingProposal.expired || pendingProposal.isScam
                        }
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                </HStack>
            </VStack>
        </Screen>
    );
};
