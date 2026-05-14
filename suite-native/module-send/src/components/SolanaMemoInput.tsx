import React, { useState } from 'react';

import { formInputsMaxLength } from '@suite-common/validators';
import {
    BottomSheetModal,
    Button,
    Card,
    HStack,
    IconButton,
    Input,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { type SendFieldName, type SendOutputsFormValues } from '../sendOutputsFormSchema';

export const SolanaMemoInput = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();
    const { translate } = useTranslate();
    const [localMemo, setLocalMemo] = useState('');

    const memoFieldName: SendFieldName = 'destinationTag';
    const currentMemo = watch(memoFieldName) ?? '';
    const memoByteSize = Buffer.from(localMemo, 'utf8').length;

    const handleOpen = () => {
        setLocalMemo(currentMemo);
        openModal();
    };

    const handleSave = () => {
        setValue(memoFieldName, localMemo);
        closeModal();
    };

    const handleRemove = () => {
        setValue(memoFieldName, '');
        setLocalMemo('');
        closeModal();
    };

    return (
        <>
            {currentMemo ? (
                <Card>
                    <HStack alignItems="center">
                        <VStack spacing="sp2" flex={1}>
                            <Text variant="body-sm">
                                <Translation id="moduleSend.outputs.recipients.solana.memo.label" />
                            </Text>
                            <Text variant="body-sm" color="contentSecondary" numberOfLines={1}>
                                {currentMemo}
                            </Text>
                        </VStack>
                        <IconButton
                            iconName="pencilSimpleLine"
                            intent="neutral"
                            priority="secondary"
                            onPress={handleOpen}
                        />
                    </HStack>
                </Card>
            ) : (
                <Button
                    iconLeft="pencilSimpleLine"
                    intent="neutral"
                    priority="secondary"
                    onPress={handleOpen}
                >
                    <Translation id="moduleSend.outputs.recipients.solana.memo.addButton" />
                </Button>
            )}
            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="moduleSend.outputs.recipients.solana.memo.label" />}
                isCloseDisplayed
                onClose={closeModal}
            >
                <VStack spacing="sp16">
                    <VStack spacing="sp4">
                        <Input
                            value={localMemo}
                            onChangeText={setLocalMemo}
                            placeholder={translate(
                                'moduleSend.outputs.recipients.solana.memo.inputPlaceholder',
                            )}
                            maxLength={formInputsMaxLength.solanaMemo}
                            asBottomSheetInput
                        />
                        <Text
                            variant="body-xs"
                            color={
                                memoByteSize > formInputsMaxLength.solanaMemo
                                    ? 'contentCritical'
                                    : 'contentSecondary'
                            }
                            textAlign="left"
                        >
                            {memoByteSize}/{formInputsMaxLength.solanaMemo} bytes
                        </Text>
                    </VStack>
                    <Button
                        onPress={handleSave}
                        isDisabled={memoByteSize > formInputsMaxLength.solanaMemo}
                    >
                        <Translation id="moduleSend.outputs.recipients.solana.memo.saveButton" />
                    </Button>
                    {currentMemo && (
                        <Button intent="neutral" priority="secondary" onPress={handleRemove}>
                            <Translation id="moduleSend.outputs.recipients.solana.memo.removeButton" />
                        </Button>
                    )}
                </VStack>
            </BottomSheetModal>
        </>
    );
};
