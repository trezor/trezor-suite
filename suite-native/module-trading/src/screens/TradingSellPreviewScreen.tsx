import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { Screen } from '@suite-native/navigation';

import { SellPreviewScreenHeader, SellPreviewView } from '../components/sell/SellPreview';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { clearTradingStateThunk } from '../thunks';

export const TradingSellPreviewScreen = () => {
    const dispatch = useDispatch();
    const { doBankAccountVerificationCheck } = useSellFlow();

    useEffect(() => {
        doBankAccountVerificationCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    return (
        <Screen header={<SellPreviewScreenHeader />}>
            <SellPreviewView txnErrorString={null} />
        </Screen>
    );
};
