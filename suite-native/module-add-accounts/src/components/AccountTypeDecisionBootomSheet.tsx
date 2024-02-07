import { BottomSheet, Button, VStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

const ACCOUNT_TYPES_URL = 'https://trezor.io/learn/a/multiple-accounts-in-trezor-suite';

const descStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    paddingBottom: utils.spacings.small,
}));

type AccountTypeDecisionBootomSheetProps = {
    coinName: string;
    typeName: string;
    isVisible: boolean;
    onTypeSelectionTap: () => void;
    onConfirmTap: () => void;
    onClose: () => void;
};

export const AccountTypeDecisionBootomSheet = ({
    coinName,
    typeName,
    isVisible,
    onTypeSelectionTap,
    onConfirmTap,
    onClose,
}: AccountTypeDecisionBootomSheetProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    return (
        <BottomSheet
            title={translate('moduleAddAccounts.accountTypeDecisionBootomSheet.title', {
                coin: _ => coinName.toUpperCase(),
            })}
            isVisible={isVisible}
            onClose={onClose}
            isCloseDisplayed={false}
        >
            <VStack spacing="medium">
                <Text color="textSubdued" style={applyStyle(descStyle)}>
                    {translate('moduleAddAccounts.accountTypeDecisionBootomSheet.description', {
                        type: _ => (
                            <Text color="textDefault" variant="highlight">
                                {typeName}
                            </Text>
                        ),
                        moreLink: chunks => (
                            <Link
                                href={ACCOUNT_TYPES_URL}
                                label={chunks}
                                isUnderlined
                                textColor="textDefault"
                                textPressedColor="textDefault"
                            />
                        ),
                    })}
                </Text>
                <Button size="medium" onPress={onConfirmTap}>
                    {translate('moduleAddAccounts.accountTypeDecisionBootomSheet.buttons.confirm', {
                        type: _ => typeName,
                    })}
                </Button>
                <Button size="medium" colorScheme="tertiaryElevation0" onPress={onTypeSelectionTap}>
                    {translate('moduleAddAccounts.accountTypeDecisionBootomSheet.buttons.select')}
                </Button>
            </VStack>
        </BottomSheet>
    );
};
