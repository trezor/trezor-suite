import { Ref } from 'react';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ACCOUNT_TYPES_URL =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/multiple-accounts-in-trezor-suite';

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
    ref: Ref<BottomSheetModalMethods>;
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
        </BottomSheetModal>
    );
};
