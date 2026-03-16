import { Translation } from '@suite/intl';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { Column, Paragraph, Text } from '@trezor/components';

type CurrentDelegateProps = {
    account: Account;
};
export const CurrentDelegate = ({ account }: CurrentDelegateProps) => {
    if (account.networkType !== 'cardano') return null;

    const currentDelegateDrepId = account.misc?.staking?.drep?.drep_id;

    const getStakeProviderLabel = () => {
        if (CARDANO_EVERSTAKE_DREP.bech32 === currentDelegateDrepId) return 'Everstake';

        return <Translation id="TR_STAKE_PROVIDER_UNKNOWN" />;
    };

    return (
        <Column gap={8}>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id="TR_STAKE_CURRENT_DELEGATE" />
            </Text>
            {currentDelegateDrepId ? (
                <>
                    <Paragraph typographyStyle="body-md">{getStakeProviderLabel()}</Paragraph>
                    <Paragraph typographyStyle="body-sm">{currentDelegateDrepId}</Paragraph>
                </>
            ) : (
                <Paragraph typographyStyle="body-md">
                    <Translation id="TR_STAKE_NONE" />
                </Paragraph>
            )}
        </Column>
    );
};
