import { useEffect, useState } from 'react';

import { formInputsMaxLength } from '@suite-common/validators';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
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
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';

const inputAsciiName = 'tronDataAscii';
const inputHexName = 'transactionData';

type TronNoteInputProps = {
    symbol: NetworkSymbol;
};

export const TronNoteInput = ({ symbol }: TronNoteInputProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();
    const { translate } = useTranslate();
    const [localNote, setLocalNote] = useState('');

    const networkDisplaySymbol = getNetworkDisplaySymbol(symbol);

    const asciiValue = watch(inputAsciiName) ?? '';
    const hexValue = Buffer.from(localNote || '', 'utf8').toString('hex');

    const hexByteSize = hexValue.length;
    const isHexTooLong = hexByteSize > formInputsMaxLength.tronNote;

    useEffect(() => {
        setLocalNote(asciiValue);
    }, [asciiValue]);

    useEffect(() => {
        setValue(inputHexName, Buffer.from(asciiValue || '', 'utf8').toString('hex'));
    }, [asciiValue, setValue]);

    const onOpenPress = () => {
        setLocalNote(asciiValue);
        openModal();
    };

    const onSavePress = () => {
        setValue(inputAsciiName, localNote);
        setValue(inputHexName, hexValue);
        closeModal();
    };

    const onRemovePress = () => {
        setValue(inputAsciiName, '');
        setValue(inputHexName, '');
        setLocalNote('');
        closeModal();
    };

    return (
        <>
            {asciiValue ? (
                <Card>
                    <VStack spacing="sp12" alignItems="center">
                        <HStack alignItems="center">
                            <VStack spacing="sp2" flex={1}>
                                <Text variant="body-sm">
                                    <Translation id="moduleSend.tron.note.label" />
                                </Text>

                                <Text variant="body-sm" color="contentSecondary" numberOfLines={1}>
                                    {asciiValue}
                                </Text>
                            </VStack>

                            <IconButton
                                iconName="pencilSimpleLine"
                                intent="neutral"
                                priority="secondary"
                                onPress={onOpenPress}
                            />
                        </HStack>

                        <HStack alignItems="center" spacing="sp4">
                            <Icon name="info" size={20} />
                            <Text variant="body-sm">
                                <Translation
                                    id="moduleSend.tron.note.info"
                                    values={{ networkDisplaySymbol }}
                                />
                            </Text>
                        </HStack>
                    </VStack>
                </Card>
            ) : (
                <Button
                    iconLeft="pencilSimpleLine"
                    intent="neutral"
                    priority="secondary"
                    onPress={onOpenPress}
                >
                    <Translation id="moduleSend.tron.note.addButton" />
                </Button>
            )}

            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="moduleSend.tron.note.label" />}
                isCloseDisplayed
                onClose={closeModal}
            >
                <VStack spacing="sp16">
                    <HStack alignItems="center" spacing="sp4">
                        <Icon name="info" size={20} />
                        <Text variant="body-sm">
                            <Translation
                                id="moduleSend.tron.note.info"
                                values={{ networkDisplaySymbol }}
                            />
                        </Text>
                    </HStack>

                    <VStack spacing="sp4">
                        <Input
                            value={localNote}
                            onChangeText={setLocalNote}
                            placeholder={translate('moduleSend.tron.note.inputPlaceholder')}
                            maxLength={formInputsMaxLength.tronNote}
                            asBottomSheetInput
                        />

                        <Text
                            variant="body-xs"
                            color={isHexTooLong ? 'contentCritical' : 'contentSecondary'}
                            textAlign="left"
                        >
                            {hexByteSize}/{formInputsMaxLength.tronNote} bytes
                        </Text>
                    </VStack>

                    <Button onPress={onSavePress} isDisabled={isHexTooLong}>
                        <Translation id="moduleSend.tron.note.saveButton" />
                    </Button>

                    {asciiValue && (
                        <Button intent="neutral" priority="secondary" onPress={onRemovePress}>
                            <Translation id="moduleSend.tron.note.removeButton" />
                        </Button>
                    )}
                </VStack>
            </BottomSheetModal>
        </>
    );
};
