import * as React from 'react';
import { Button } from '@trezor/components';
import { useSavingsKYCStart } from '@wallet-hooks/coinmarket/savings/useSavingsKYCStart';
import { withCoinmarketSavingsLoaded } from '@wallet-components/hocs';

const KYCStart = () => {
    const { onSubmit, handleSubmit } = useSavingsKYCStart();
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            This is KYC Start.
            <Button>Next step</Button>
        </form>
    );
};

export default withCoinmarketSavingsLoaded(KYCStart);
