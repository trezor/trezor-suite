import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { type TradingCountryInputProps } from '@suite/trading';
import {
    type OtcProviderType,
    getDefaultCountry,
    isCountryCode,
    useFetchOtc,
} from '@suite-common/trading';
import { Button, Card, Column } from '@trezor/components';

import { TradingConciergeCountryInput } from './TradingConciergeCountryInput';
import { TradingConciergeProviderInput } from './TradingConciergeProviderInput';

export const TradingConciergeForm = () => {
    const { data: otcData, isLoading } = useFetchOtc();
    const [country, setCountry] = useState<TradingCountryInputProps['country']>(
        getDefaultCountry().value,
    );
    const [provider, setProvider] = useState<OtcProviderType | null>(null);

    const handleCountryChange = (newCountry: TradingCountryInputProps['country']) => {
        setCountry(newCountry);
        setProvider(null);
    };

    useEffect(() => {
        if (otcData?.country && isCountryCode(otcData.country)) {
            setCountry(otcData.country);
        }
    }, [otcData]);

    return (
        <>
            <Card paddingType="none">
                <Column hasDivider>
                    <TradingConciergeCountryInput
                        onChange={handleCountryChange}
                        country={country}
                        isLoading={isLoading}
                    />
                    <TradingConciergeProviderInput
                        provider={provider}
                        country={country}
                        onProviderSelect={setProvider}
                        isLoading={isLoading}
                    />
                </Column>
            </Card>
            <Button width="100%" isDisabled={!provider} href={provider?.url} size="large">
                <Translation id="TR_CONTINUE" />
            </Button>
        </>
    );
};
