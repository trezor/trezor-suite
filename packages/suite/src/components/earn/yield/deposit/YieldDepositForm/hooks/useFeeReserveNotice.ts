import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';

export type FeeReserveNotice = {
    amount: string;
    nativeSymbol: string;
};

type UseFeeReserveNoticeParams = {
    networkSymbol: NetworkSymbol;
    /** Fee reserve in display units. */
    reserve: string;
};

/** Formats a native-coin fee reserve for the translation values of a fee reserve warning. */
export const useFeeReserveNotice = ({
    networkSymbol,
    reserve,
}: UseFeeReserveNoticeParams): FeeReserveNotice => {
    const { CryptoAmountFormatter } = useFormatters();

    return {
        amount: CryptoAmountFormatter.format(reserve, {
            symbol: networkSymbol,
            isBalance: true,
            withSymbol: false,
        }),
        nativeSymbol: getNetworkDisplaySymbol(networkSymbol),
    };
};
