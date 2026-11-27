import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';

import { selectAreTransferButtonsVisible } from '../../homescreenSelectors';
import { TransferButtons } from '../TransferButtons';

export const PortfolioActionButtons = () => {
    const areTransferButtonsVisible = useSelector(selectAreTransferButtonsVisible);

    if (!areTransferButtonsVisible) return null;

    return (
        <VStack paddingHorizontal="sp20">
            <TransferButtons />
        </VStack>
    );
};
