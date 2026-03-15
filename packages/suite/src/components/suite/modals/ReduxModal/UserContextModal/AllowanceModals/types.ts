export type AllowanceProviderLogoSource = 'invity' | 'url';

export type AllowanceProvider = {
    name: string;
    companyName: string;
    logo: string;
    logoSource?: AllowanceProviderLogoSource;
};
