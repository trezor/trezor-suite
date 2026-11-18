import { Translation } from '@suite/intl';
import { Button, Card, Column, Paragraph } from '@trezor/components';

type ReferralRewardsKeyMissingProps = {
    isDeviceConnected: boolean;
    isDerivingKey: boolean;
    onDeriveKey: () => void;
};

// The link is stored but the key is not (web, Linux without a keyring), so the rewards need Trezor.
export const ReferralRewardsKeyMissing = ({
    isDeviceConnected,
    isDerivingKey,
    onDeriveKey,
}: ReferralRewardsKeyMissingProps) => (
    <Card data-testid="@referral/rewards-key-missing">
        <Column padding={{ vertical: 24, horizontal: 16 }} gap={16} alignItems="center">
            <Paragraph intent="neutral" priority="secondary" align="center">
                <Translation
                    id={
                        isDeviceConnected
                            ? 'TR_REFERRAL_LOAD_REWARDS_DESCRIPTION'
                            : 'TR_REFERRAL_CONNECT_DESCRIPTION'
                    }
                />
            </Paragraph>
            {isDeviceConnected && (
                <Button
                    isLoading={isDerivingKey}
                    onClick={onDeriveKey}
                    data-testid="@referral/rewards-key-missing/load"
                >
                    <Translation id="TR_REFERRAL_LOAD_REWARDS" />
                </Button>
            )}
        </Column>
    </Card>
);
