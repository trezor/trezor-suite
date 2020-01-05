type Code = 'en' | 'cs' | 'de' | 'es' | 'fr' | 'ru';

export interface Language {
    code: Code;
    name: string;
    en: string;
}

export type Languages = Language[];
