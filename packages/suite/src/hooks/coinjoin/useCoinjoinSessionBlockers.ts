import { useSelector, useTranslation } from '@suite-hooks';
import { Feature, selectFeatureMessageContent } from '@suite-reducers/messageSystemReducer';
import { selectCoinjoinSessionBlockerByAccountKey } from '@wallet-reducers/coinjoinReducer';

export const useCoinjoinSessionBlockers = (
    accountKey: string,
): {
    coinjoinSessionBlocker: ReturnType<typeof selectCoinjoinSessionBlockerByAccountKey>;
    coinjoinSessionBlockedMessage?: string;
    isCoinjoinSessionBlocked: boolean;
} => {
    const blocker = useSelector(state =>
        selectCoinjoinSessionBlockerByAccountKey(state, accountKey),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );

    const { translationString } = useTranslation();

    const getMessage = () => {
        switch (blocker) {
            case 'FEATURE_DISABLED':
                return featureMessageContent;
            case 'OFFLINE':
                return translationString('TR_UNAVAILABLE_COINJOIN_NO_INTERNET');
            case 'NOTHING_TO_ANONYMIZE':
                return translationString('TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL');
            case 'TOR_DISABLED':
                return translationString('TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP');
            case 'DEVICE_DISCONNECTED':
                return translationString('TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED');
            case 'ACCOUNT_OUT_OF_SYNC':
                return translationString('TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC');
            default:
                // some ephemeral states do not have a message to display
                return undefined;
        }
    };

    return {
        coinjoinSessionBlocker: blocker,
        coinjoinSessionBlockedMessage: getMessage(),
        isCoinjoinSessionBlocked: !!blocker,
    };
};
