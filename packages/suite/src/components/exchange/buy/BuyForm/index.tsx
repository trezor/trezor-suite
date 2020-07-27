import React from 'react';
import { H2, P } from '@trezor/components';
import { useBuyInfo } from '@suite/hooks/exchange';

const BuyForm = () => {
    const { buyInfo } = useBuyInfo();

    return (
        <>
            <H2>Buy form</H2>
            {!buyInfo.buyInfo || !buyInfo.buyInfo.providers.length ? (
                <P>Loading...</P>
            ) : (
                <>
                    <P>{JSON.stringify(buyInfo.providerInfos)}</P>
                </>
            )}
        </>
    );
};

export default BuyForm;
