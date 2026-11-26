export type ShareQRCodeImageParams = {
    imageURI: string;
    title: string;
};

type ShareQRCodeImageResult = 'shared' | 'dismissed' | 'unknown';

export type ShareQRCodeImage = (params: ShareQRCodeImageParams) => Promise<ShareQRCodeImageResult>;
