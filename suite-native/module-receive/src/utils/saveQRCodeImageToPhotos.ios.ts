// This is the iOS implementation selected by Metro through the `.ios` filename suffix.
type SaveQRCodeImageToPhotosResult = 'saved' | 'permissionDenied';

export const saveQRCodeImageToPhotos = async (
    getQRCodeImageURI: () => Promise<string>,
): Promise<SaveQRCodeImageToPhotosResult> => {
    // The `legacy` entry point is used intentionally: `saveToLibraryAsync` only requires
    // add-only ("write") photo permission, while the current `Asset.create` API needs full
    // library access, which the app does not request.
    const MediaLibrary = await import('expo-media-library/legacy');
    const permission = await MediaLibrary.requestPermissionsAsync(true);

    if (!permission.granted) {
        return 'permissionDenied';
    }

    await MediaLibrary.saveToLibraryAsync(await getQRCodeImageURI());

    return 'saved';
};
