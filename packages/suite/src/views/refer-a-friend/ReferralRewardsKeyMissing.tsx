import { toggleConnectionModal } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { Button, Card, Column, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type ReferralRewardsKeyMissingProps = {
    isDeviceConnected: boolean;
    canDeriveKey: boolean;
    isDerivingKey: boolean;
    onDeriveKey: () => void;
};

type GetDescriptionParams = Pick<
    ReferralRewardsKeyMissingProps,
    'isDeviceConnected' | 'canDeriveKey'
>;

const getDescription = ({
    isDeviceConnected,
    canDeriveKey,
}: GetDescriptionParams): TranslationKey => {
    if (!isDeviceConnected) {
        return 'TR_REFERRAL_CONNECT_DESCRIPTION';
    }

    return canDeriveKey
        ? 'TR_REFERRAL_LOAD_REWARDS_DESCRIPTION'
        : 'TR_REFERRAL_SWITCH_TO_STANDARD_WALLET';
};

// The link is stored but the key is not (web, Linux without a keyring), so the rewards need Trezor.
export const ReferralRewardsKeyMissing = ({
    isDeviceConnected,
    canDeriveKey,
    isDerivingKey,
    onDeriveKey,
}: ReferralRewardsKeyMissingProps) => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <Card data-testid="@referral/rewards-key-missing">
            <Column padding={{ vertical: 24, horizontal: 16 }} gap={16} alignItems="center">
                <Paragraph intent="neutral" priority="secondary" align="center">
                    <Translation id={getDescription({ isDeviceConnected, canDeriveKey })} />
                </Paragraph>
                {!isDeviceConnected && (
                    <Button
                        onClick={() => dispatch(toggleConnectionModal())}
                        data-testid="@referral/rewards-key-missing/connect"
                    >
                        <Translation id="TR_CONNECT" />
                    </Button>
                )}
                {isDeviceConnected && canDeriveKey && (
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
};
