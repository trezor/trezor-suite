import { Translation, TxKeyPath } from '@suite-native/intl';

type ApyValueProps = {
    apy: number | null | undefined;
    notAvailableTranslationId?: TxKeyPath;
};

export const ApyValue = ({
    apy,
    notAvailableTranslationId = 'earn.apyNotAvailable',
}: ApyValueProps) => {
    if (apy == null) {
        return <Translation id={notAvailableTranslationId} />;
    }

    return <>{`${apy}%`}</>;
};
