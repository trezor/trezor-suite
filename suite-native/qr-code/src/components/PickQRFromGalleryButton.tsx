import { scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@suite-native/atoms';
import { useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';

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
        const imageUri = pickedImage?.assets?.[0].uri;

        try {
            const scannedResults = await scanFromURLAsync(imageUri!, ['qr']);
            const { data } = scannedResults[0];

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
        <Button onPress={handlePickImage} viewLeft="image" colorScheme="tertiaryElevation0">
            <Translation id="qrCode.pickImageButton" />
        </Button>
    );
};
