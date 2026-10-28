import { Translation, type TranslationKey } from '@suite/intl';
import { type ReferralError as ReferralErrorType } from '@suite-common/refer-a-friend';
import { Banner } from '@trezor/components';

import { getReferralErrorTranslationKey } from './getReferralErrorTranslationKey';

type ReferralErrorProps = {
    title: TranslationKey;
    error: ReferralErrorType | null;
    onRetry: () => void;
};

export const ReferralError = ({ title, error, onRetry }: ReferralErrorProps) => (
    <Banner
        intent="critical"
        data-testid="@referral/error"
        title={<Translation id={title} />}
        description={
            <Translation
                id={error ? getReferralErrorTranslationKey(error) : 'TR_REFERRAL_ERROR_GENERIC'}
            />
        }
        rightContent={
            <Banner.Button onClick={onRetry} data-testid="@referral/error/retry">
                <Translation id="TR_RETRY" />
            </Banner.Button>
        }
    />
);
