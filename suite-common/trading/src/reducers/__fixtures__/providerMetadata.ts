import type { ProviderMetadata } from 'invity-api';

export const getProviderMetadataFixture = (
    providerName: string = 'changenow',
): ProviderMetadata => ({
    name: providerName,
    companyName: providerName,
    logo: `${providerName}-icon.jpg`,
    isActive: true,
    supportUrl: `https://support.${providerName}.io`,
    statusUrl: `https://${providerName}.io/exchange/txs/{{orderId}}`,
    termsUrl: `https://${providerName}.io/terms-of-use`,
});
