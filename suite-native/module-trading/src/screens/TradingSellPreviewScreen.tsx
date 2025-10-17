import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingSellSelectedQuote } from '@suite-common/trading';
import { Screen } from '@suite-native/navigation';

import { SellPreviewScreenHeader, SellPreviewView } from '../components/sell/SellPreview';
import { clearTradingStateThunk } from '../thunks';

export const TradingSellPreviewScreen = () => {
    const dispatch = useDispatch();

    const quote = useSelector(selectTradingSellSelectedQuote);

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    return (
        <Screen header={<SellPreviewScreenHeader />}>
            <SellPreviewView quote={quote} txnErrorString={null} />
        </Screen>
    );
};
