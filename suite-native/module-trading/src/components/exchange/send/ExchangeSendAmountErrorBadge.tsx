import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';

export const ExchangeSendAmountErrorBadge = () => {
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const { errorMessage, hasError } = useField({ name: 'sendCryptoAmount' });

    if (isLoading || !hasError) {
        return null;
    }

    return <Badge label={errorMessage} intent="critical" size="small" />;
};
