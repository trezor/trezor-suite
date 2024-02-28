import { httpRequest } from '../../utils/assets';

export const getLanguage = ({
    baseUrl,
    language,
    version,
    model_internal,
}: {
    baseUrl: string;
    language: string;
    version: number[];
    model_internal: string;
}) => {
    // todo: signed?
    // todo: for production
    // const url = `${baseUrl}/data/translations/translation-${model_internal}-${language}-${version.join('.')}-unsigned.bin`;

    // for local dev temporary
    const url = `${baseUrl}/translation-${model_internal}-${language}-${version.join('.')}-unsigned.bin`;

    return httpRequest(url, 'binary');
};
