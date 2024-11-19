import { useState } from 'react';

import { Checkbox, NewModal, Column, Banner, Card, IconName } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
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
    };

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
                        symbol: account?.symbol.toUpperCase(),
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
                        symbol: account?.symbol.toUpperCase(),
                    }}
                />
            ),
        },
    ];

    return (
        <NewModal
            heading={
                <Translation
                    id="TR_STAKE_NETWORK"
                    values={{ symbol: account?.symbol.toUpperCase() }}
                />
            }
            description={<Translation id="TR_STAKE_YOUR_FUNDS_MAINTAINED" />}
            onCancel={onCancel}
            size="small"
            bottomContent={
                <>
                    <NewModal.Button isDisabled={!hasAgreed} onClick={proceedToStaking}>
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
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
