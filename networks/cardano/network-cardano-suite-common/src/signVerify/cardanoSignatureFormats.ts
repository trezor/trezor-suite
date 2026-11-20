export const CARDANO_SIGNATURE_FORMATS = ['raw', 'cose'] as const;

export type CardanoSignatureFormat = (typeof CARDANO_SIGNATURE_FORMATS)[number];

export const CARDANO_DEFAULT_SIGNATURE_FORMAT: CardanoSignatureFormat = 'raw';
