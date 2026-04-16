import { scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

type PickQRFromGalleryButtonProps = {
    onImagePicked: (data: string) => void;
    onError: () => void;
};

export const PickQRFromGalleryButton = ({
    onImagePicked,
    onError,
}: PickQRFromGalleryButtonProps) => {
    const { showToast } = useToast();

    const handlePickImage = async () => {
        const pickedImage = await ImagePicker.launchImageLibraryAsync({});
        const imageUri = pickedImage?.assets?.[0]?.uri;

        try {
            if (!imageUri) {
                throw new Error('No image selected');
            }
            const scannedResults = await scanFromURLAsync(imageUri, ['qr']);
            const firstResult = scannedResults[0];
            if (!firstResult) {
                throw new Error('No QR code found');
            }
            const { data } = firstResult;

            onImagePicked(data);
        } catch {
            onError();
            showToast({
                variant: 'error',
                icon: 'warning',
                message: <Translation id="qrCode.pickImageError" />,
            });
        }
    };

    return (
        <Button onPress={handlePickImage} iconLeft="image" intent="neutral" priority="secondary">
            <Translation id="qrCode.pickImageButton" />
        </Button>
    );
};
