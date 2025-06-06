import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const ExchangeAlert = () => {
    const { watch } = useExchangeFormContext();
    const text = watch('generalAlert');

    return <GeneralAlert text={text} />;
};
