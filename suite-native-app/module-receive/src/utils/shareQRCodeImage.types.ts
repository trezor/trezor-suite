export type ShareQRCodeImageParams = {
    imageURI: string;
    title: string;
};

export type ShareQRCodeImage = (params: ShareQRCodeImageParams) => Promise<boolean>;
