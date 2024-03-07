import { httpRequest } from '../../utils/assets';

export const getLanguage = ({
    baseUrl,
    language,
    version,
    internal_model,
}: {
    baseUrl: string;
    language: string;
    version: number[];
    internal_model: string;
}) => {
    // todo: signed?
    // todo: for production

    const url = `${baseUrl}/data/translations/translation-${internal_model}-${language}-${version.join('.')}-unsigned.bin`;

    return httpRequest(url, 'binary');
};
