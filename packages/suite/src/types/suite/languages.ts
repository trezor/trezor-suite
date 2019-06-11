type Code =
    | 'en'
    | 'bn'
    | 'cs'
    | 'de'
    | 'el'
    | 'es'
    | 'fr'
    | 'id'
    | 'it'
    | 'ja'
    | 'nl'
    | 'pl'
    | 'pt'
    | 'ru'
    | 'uk'
    | 'zh'
    | 'zh_TW';

export interface Language {
    code: Code;
    name: string;
    en: string;
}

export type Languages = Language[];
