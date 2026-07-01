import { useDispatch, useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import {
    selectAreDebugTranslationKeysDisplayed,
    setAreDebugTranslationKeysDisplayed,
} from '@suite-native/intl';

import { DevCheckBoxListItem } from './DevCheckBoxListItem';

export const TranslationUtils = () => {
    const dispatch = useDispatch();
    const areDebugTranslationKeysDisplayed = useSelector(selectAreDebugTranslationKeysDisplayed);

    const toggleDebugTranslationKeys = () => {
        dispatch(setAreDebugTranslationKeysDisplayed(!areDebugTranslationKeysDisplayed));
    };

    return (
        <VStack>
            <DevCheckBoxListItem
                title="Show translation IDs"
                onPress={toggleDebugTranslationKeys}
                isChecked={areDebugTranslationKeysDisplayed}
            />
        </VStack>
    );
};
