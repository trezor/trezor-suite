export interface CountryInfo {
    country: string;
    fiatCurrency?: string; // optional field, fiat currency based on country
}

export type TicketTopic = 'Invity.io' | 'Buy crypto' | 'Exchange crypto' | 'Invest in crypto';

export interface SupportTicket {
    name: string;
    email: string;
    description: string;
    topic: TicketTopic;
    reCaptchaV2Token?: string;
    reCaptchaV3Token?: string;
}

export interface SupportTicketResponse {
    error?: string;
    statusCode: number;
}
