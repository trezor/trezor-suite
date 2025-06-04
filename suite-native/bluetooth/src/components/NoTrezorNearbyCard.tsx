import { Button, Card, IconListTextItem, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type NoTrezorNearbyCardProps = {
    onScanAgain: () => void;
};

export const NoTrezorNearbyCard = ({ onScanAgain }: NoTrezorNearbyCardProps) => (
    <Card>
        <VStack marginTop="sp16" spacing="sp24">
            <PictogramTitleHeader
                variant="info"
                title={<Translation id="bluetooth.noTrezorNearbyCard.title" />}
            />
            <VStack spacing="sp24">
                <IconListTextItem icon="power" iconSize="large" textColor="textSubdued">
                    <Translation id="bluetooth.noTrezorNearbyCard.hints.1" />
                </IconListTextItem>
                <IconListTextItem
                    icon="bluetoothConnected"
                    iconSize="large"
                    textColor="textSubdued"
                >
                    <Translation id="bluetooth.noTrezorNearbyCard.hints.2" />
                </IconListTextItem>
            </VStack>
            <Button onPress={onScanAgain}>
                <Translation id="bluetooth.noTrezorNearbyCard.scanAgainButton" />
            </Button>
        </VStack>
    </Card>
);
