import { Badge, type BadgeIntent, Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { spacingsNew } from '@trezor/theme';

type BackupAlternativeCardProps = {
    badgeLabel: TxKeyPath;
    badgeIntent?: BadgeIntent;
    title: TxKeyPath;
    description: TxKeyPath;
    buttonLabel: TxKeyPath;
    onPress: () => void;
    buttonPriority?: 'primary' | 'secondary';
};

export const BackupAlternativeCard = ({
    badgeLabel,
    badgeIntent = 'brand',
    title,
    description,
    buttonLabel,
    onPress,
    buttonPriority = 'primary',
}: BackupAlternativeCardProps) => (
    <Card testID="@backup-alternative-card">
        <VStack spacing={spacingsNew[11]}>
            <Badge
                testID="@backup-alternative-card/badge"
                label={<Translation id={badgeLabel} />}
                intent={badgeIntent}
                size="small"
                style={{ alignSelf: 'center' }}
            />
            <Text textAlign="center" testID="@backup-alternative-card/title" variant="headline-sm">
                <Translation id={title} />
            </Text>
            <Text
                textAlign="center"
                testID="@backup-alternative-card/description"
                variant="body-md"
                color="contentSecondary"
            >
                <Translation id={description} />
            </Text>
            <Button
                testID="@backup-alternative-card/button"
                onPress={onPress}
                priority={buttonPriority}
            >
                <Translation id={buttonLabel} />
            </Button>
        </VStack>
    </Card>
);
