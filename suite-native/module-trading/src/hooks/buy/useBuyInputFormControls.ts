import { useBuyFormContext } from './useBuyFormContext';
import { useInputFieldControls } from '../general/useInputFieldControls';

export const useBuyInputFormControls = (name: 'fiatValue' | 'cryptoValue') => {
    const { getValues, setValue } = useBuyFormContext();
    const value = getValues(name);

    return useInputFieldControls(name, value, setValue);
};
