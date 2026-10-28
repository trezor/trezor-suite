import { Translation, type TranslationKey } from '@suite/intl';
import { Banner } from '@trezor/components';

type ReferralErrorProps = {
    title: TranslationKey;
    onRetry: () => void;
};

export const ReferralError = ({ title, onRetry }: ReferralErrorProps) => (
    <Banner
        intent="critical"
        data-testid="@referral/error"
        title={<Translation id={title} />}
        description={<Translation id="TR_REFERRAL_ERROR_GENERIC" />}
        rightContent={
            <Banner.Button onClick={onRetry} data-testid="@referral/error/retry">
                <Translation id="TR_RETRY" />
            </Banner.Button>
        }
    />
);
