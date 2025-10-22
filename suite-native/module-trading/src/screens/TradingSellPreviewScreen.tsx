import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { Screen } from '@suite-native/navigation';

import { SellPreviewScreenHeader, SellPreviewView } from '../components/sell/SellPreview';
import { clearTradingStateThunk } from '../thunks';

export const TradingSellPreviewScreen = () => {
    const dispatch = useDispatch();

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
