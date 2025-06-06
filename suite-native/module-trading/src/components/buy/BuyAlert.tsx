import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const BuyAlert = () => {
    const { watch } = useBuyFormContext();
    const text = watch('generalAlert');

    return <GeneralAlert text={text} />;
};
