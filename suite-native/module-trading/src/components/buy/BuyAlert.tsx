import { useWatch } from '@suite-native/forms';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { GeneralAlert } from '../general/GeneralAlert';

export const BuyAlert = () => {
    const { control } = useBuyFormContext();
    const text = useWatch({ control, name: 'generalAlert' });

    return <GeneralAlert text={text} />;
};
