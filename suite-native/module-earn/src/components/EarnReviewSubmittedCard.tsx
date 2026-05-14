import { Button, type ButtonProps, Card, LottieAnimation, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { sendArrowsLottie } from '@suite-native/transaction-management';

type EarnReviewSubmittedCardProps = {
    buttonTranslationId: TxKeyPath;
    isButtonLoading?: ButtonProps['isLoading'];
    messageTranslationId: TxKeyPath;
    onButtonPress: ButtonProps['onPress'];
};

export const EarnReviewSubmittedCard = ({
    buttonTranslationId,
    isButtonLoading,
    messageTranslationId,
    onButtonPress,
}: EarnReviewSubmittedCardProps) => (
    <Card>
        <VStack
            paddingTop="sp8"
            paddingHorizontal="sp24"
            paddingBottom="sp24"
            alignItems="center"
            spacing="sp24"
        >
            <LottieAnimation source={sendArrowsLottie} size="small" />
            <Text variant="body-md-strong" textAlign="center">
                <Translation id={messageTranslationId} />
            </Text>
        </VStack>
        <Button isLoading={isButtonLoading} onPress={onButtonPress}>
            <Translation id={buttonTranslationId} />
        </Button>
    </Card>
);
