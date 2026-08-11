import { Button, type ButtonProps, Card } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type EarnReviewSubmittedCardProps = {
    buttonTranslationId: TxKeyPath;
    isButtonLoading?: ButtonProps['isLoading'];
    onButtonPress: ButtonProps['onPress'];
};

export const EarnReviewSubmittedCard = ({
    buttonTranslationId,
    isButtonLoading,
    onButtonPress,
}: EarnReviewSubmittedCardProps) => (
    <Card>
        <Button isLoading={isButtonLoading} onPress={onButtonPress}>
            <Translation id={buttonTranslationId} />
        </Button>
    </Card>
);
