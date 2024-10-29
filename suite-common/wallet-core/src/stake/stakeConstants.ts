import { SupportedNetworkSymbol } from '@suite-common/wallet-types';

export const EVERSTAKE_ENDPOINT_PREFIX: Record<SupportedNetworkSymbol, string> = {
    eth: 'https://eth-api-b2c.everstake.one/api/v1',
    thol: 'https://eth-api-b2c-stage.everstake.one/api/v1',
};
