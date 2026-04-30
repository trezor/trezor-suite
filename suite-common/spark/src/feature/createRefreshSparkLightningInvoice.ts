import { type LoadSparkWalletDep, type SparkWalletParams } from './createLoadSparkWallet';

export type RefreshSparkLightningInvoice = (params: SparkWalletParams) => Promise<void>;

export type RefreshSparkLightningInvoiceDep = {
    refreshSparkLightningInvoice: RefreshSparkLightningInvoice;
};

export type RefreshSparkLightningInvoiceDeps = LoadSparkWalletDep;

export const createRefreshSparkLightningInvoice =
    (deps: RefreshSparkLightningInvoiceDeps): RefreshSparkLightningInvoice =>
    params =>
        deps.loadSparkWallet(params);
