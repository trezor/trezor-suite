import { useSellFormContext } from './useSellFormContext';
import { useInputFieldControls } from '../general/useInputFieldControls';

export const useSellInputFormControls = (name: 'fiatStringAmount' | 'cryptoStringAmount') => {
    const { getValues, setValue } = useSellFormContext();
    const value = getValues(name);

    return useInputFieldControls(name, value, setValue);
};
