import { useState } from 'react';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Banner, Card, Checkbox, Column, IconName, NewModal } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

interface EverstakeModalProps {
    onCancel: () => void;
}

export const EverstakeModal = ({ onCancel }: EverstakeModalProps) => {
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);

    const proceedToStaking = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'continue',
                step: 'funds-maintained-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const onCancelClick = () => {
        onCancel();

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'cancel',
                step: 'funds-maintained-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    if (!account) return null;

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const banners: {
        icon: IconName;
        message: JSX.Element;
    }[] = [
        {
            icon: 'fileFilled',
            message: (
                <Translation
                    id={
                        account?.networkType === 'ethereum'
                            ? 'TR_STAKE_EVERSTAKE_MANAGES'
                            : 'TR_STAKE_BY_STAKING_YOU_CAN_EARN_REWARDS'
                    }
                    values={{
                        networkDisplaySymbol: displaySymbol,
                        t: text => <strong>{text}</strong>,
                    }}
                />
            ),
        },
        {
            icon: 'shieldWarningFilled',
            message: (
                <Translation
                    id={
                        account?.networkType === 'ethereum'
                            ? 'TR_STAKE_TREZOR_NO_LIABILITY'
                            : 'TR_STAKE_SECURELY_DELEGATE_TO_EVERSTAKE'
                    }
                    values={{
                        symbol: displaySymbol,
                    }}
                />
            ),
        },
    ];

    return (
        <NewModal
            heading={<Translation id="TR_STAKE_NETWORK" values={{ symbol: displaySymbol }} />}
            description={<Translation id="TR_STAKE_YOUR_FUNDS_MAINTAINED" />}
            onCancel={onCancelClick}
            size="small"
            bottomContent={
                <>
                    <NewModal.Button isDisabled={!hasAgreed} onClick={proceedToStaking}>
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.sm} margin={{ top: spacings.xs, bottom: spacings.lg }}>
                {banners.map(({ icon, message }, index) => (
                    <Banner icon={icon} variant="info" key={index}>
                        {message}
                    </Banner>
                ))}
            </Column>
            <Card>
                <Checkbox
                    verticalAlignment="center"
                    onClick={() => setHasAgreed(!hasAgreed)}
                    isChecked={hasAgreed}
                >
                    <Translation id="TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
