import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsAmountInSats, SettingsSliceRootState } from '@suite-native/settings';

const decimalTransformer = (value: string) =>
    value
        .replace(/,/g, '.') // remove all non-numeric characters
        .replace(/[^\d.]/g, '') // remove all non-numeric characters
        .replace(/^\./g, '') // remove '.' symbol if it is not preceded by number
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/^0+(?=\d)/g, ''); // remove all leading zeros except the first one

const integerTransformer = (value: string) =>
    value
        .replace(/\D/g, '') // remove all non-digit characters
        .replace(/^0+/g, ''); // remove all leading zeros

export const useSendAmountTransformers = (networkSymbol: NetworkSymbol | undefined) => {
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, networkSymbol),
    );

    return {
        cryptoAmountTransformer: isAmountInSats ? integerTransformer : decimalTransformer,
        fiatAmountTransformer: decimalTransformer,
    };
};
