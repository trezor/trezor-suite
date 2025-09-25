import * as StoreReview from 'expo-store-review';

import { useIsInAppRatingEnabled } from './useIsInAppRatingEnabled';

export const useInAppRating = () => {
    const isAppRatingEnabled = useIsInAppRatingEnabled();

    const askForRating = async () => {
        if (!isAppRatingEnabled) return;

        try {
            const canReview = await StoreReview.hasAction();

            if (!canReview) {
                console.warn('In-app review not allowed on this device');

                return;
            }

            // Adding a small delay to ensure the prompt is shown at an appropriate time
            await new Promise(resolve => {
                setTimeout(async () => {
                    await StoreReview.requestReview();
                    resolve(undefined);
                }, 1000);
            });
        } catch (error) {
            console.warn('In-app review error:', error);
        }
    };

    return { askForRating };
};
