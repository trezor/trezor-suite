import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const SellAlert = () => {
    const { watch } = useSellFormContext();
    const text = watch('generalAlert');

    return <GeneralAlert text={text} />;
};
