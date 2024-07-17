declare module '@everstake/wallet-sdk' {
    export class Ethereum {
        static selectNetwork(
            network: 'mainnet' | 'holesky',
            url?: string,
        ): {
            address_accounting: string;
            address_pool: string;
            contract_pool: any;
            contract_accounting: any;
            address_withdraw_treasury: string;
        };
    }
}
