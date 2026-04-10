import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { TREZOR_SUPPORT_MULTIPLE_ACCOUNTS } from '@trezor/urls';

const descStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    paddingBottom: utils.spacings.sp8,
}));

type AccountTypeDecisionBottomSheetProps = {
    coinName: string;
    typeName: string;
    onTypeSelectionTap: () => void;
    onConfirmTap: () => void;
    onClose: () => void;
    ref: BottomSheetModalRef;
};

export const AccountTypeDecisionBottomSheet = ({
    coinName,
    typeName,
    onTypeSelectionTap,
    onConfirmTap,
    onClose,
    ref,
}: AccountTypeDecisionBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheetModal
            ref={ref}
            title={
                <Translation
                    id="moduleAddAccounts.accountTypeDecisionBottomSheet.title"
                    values={{
                        coin: _ => coinName.toUpperCase(),
                    }}
                />
            }
            onDismiss={onClose}
            isCloseDisplayed={false}
        >
            <VStack spacing="sp16">
                <Text color="textSubdued" style={applyStyle(descStyle)}>
                    <Translation
                        id="moduleAddAccounts.accountTypeDecisionBottomSheet.description"
                        values={{
                            type: _ => (
                                <Text key="type-name" color="textDefault" variant="body-md-strong">
                                    {typeName}
                                </Text>
                            ),
                            moreLink: chunks => (
                                <Link
                                    key="multiple-accounts-support-link"
                                    href={TREZOR_SUPPORT_MULTIPLE_ACCOUNTS}
                                    label={chunks}
                                    isUnderlined
                                    textColor="textDefault"
                                    textPressedColor="textDefault"
                                />
                            ),
                        }}
                    />
                </Text>
                <Button onPress={onConfirmTap} testID={`@add-account/button-${typeName}`}>
                    <Translation
                        id="moduleAddAccounts.accountTypeDecisionBottomSheet.buttons.confirm"
                        values={{
                            type: _ => typeName,
                        }}
                    />
                </Button>
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={onTypeSelectionTap}
                    testID="@add-account/button-select-type"
                >
                    <Translation id="moduleAddAccounts.accountTypeDecisionBottomSheet.buttons.select" />
                </Button>
            </VStack>
        </BottomSheetModal>
    );
};
