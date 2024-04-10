import { httpRequest } from '../utils/assets';

export const getLanguage = ({
    language,
    version,
    internal_model,
}: {
    language: string;
    version: number[];
    internal_model: string;
}) => {
    const url = `https://data.trezor.io/firmware/translations/${internal_model.toLowerCase()}/translation-${internal_model.toUpperCase()}-${language}-${version.join('.')}.bin`;

    return httpRequest(url, 'binary');
};
