import { useWatch } from '@suite-native/forms';

import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const SellAlert = () => {
    const { control } = useSellFormContext();
    const text = useWatch({ control, name: 'generalAlert' });

    return <GeneralAlert text={text} />;
};
