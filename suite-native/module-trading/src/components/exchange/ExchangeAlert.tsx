import { useWatch } from '@suite-native/forms';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const ExchangeAlert = () => {
    const { control } = useExchangeFormContext();
    const text = useWatch({ control, name: 'generalAlert' });

    return <GeneralAlert text={text} />;
};
