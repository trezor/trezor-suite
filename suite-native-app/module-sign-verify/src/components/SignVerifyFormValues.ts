export type SignFormValues = {
    format?: string;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export type VerifyFormValues = {
    address: string;
    message: string;
    signature: string;
};
