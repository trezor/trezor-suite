import { BottomSheet, Button, VStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

const ACCOUNT_TYPES_URL = 'https://trezor.io/learn/a/multiple-accounts-in-trezor-suite';

const descStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    paddingBottom: utils.spacings.small,
}));

type AccountTypeDecisionBottomSheetProps = {
    coinName: string;
    typeName: string;
    isVisible: boolean;
    onTypeSelectionTap: () => void;
    onConfirmTap: () => void;
    onClose: () => void;
};

export const AccountTypeDecisionBottomSheet = ({
    coinName,
    typeName,
    isVisible,
    onTypeSelectionTap,
    onConfirmTap,
    onClose,
}: AccountTypeDecisionBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheet
            title={
                <Translation
                    id="moduleAddAccounts.accountTypeDecisionBottomSheet.title"
                    values={{
                        coin: _ => coinName.toUpperCase(),
                    }}
                />
            }
            isVisible={isVisible}
            onClose={onClose}
            isCloseDisplayed={false}
        >
            <VStack spacing="medium">
                <Text color="textSubdued" style={applyStyle(descStyle)}>
                    <Translation
                        id="moduleAddAccounts.accountTypeDecisionBottomSheet.description"
                        values={{
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
                        }}
                    />
                </Text>
                <Button
                    size="medium"
                    onPress={onConfirmTap}
                    testID={`@add-account/button-${typeName}`}
                >
                    <Translation
                        id="moduleAddAccounts.accountTypeDecisionBottomSheet.buttons.confirm"
                        values={{
                            type: _ => typeName,
                        }}
                    />
                </Button>
                <Button
                    size="medium"
                    colorScheme="tertiaryElevation0"
                    onPress={onTypeSelectionTap}
                    testID="@add-account/button-select-type"
                >
                    <Translation id="moduleAddAccounts.accountTypeDecisionBottomSheet.buttons.select" />
                </Button>
            </VStack>
        </BottomSheet>
    );
};
