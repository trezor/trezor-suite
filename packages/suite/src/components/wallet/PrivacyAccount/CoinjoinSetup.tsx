import React from 'react';
import { useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import { Card, RadioButton, motionAnimation, motionEasing, Warning } from '@trezor/components';
import { coinjoinAccountUpdateSetupOption } from '@wallet-actions/coinjoinAccountActions';
import { AnonymityLevelSetup } from '@wallet-components/PrivacyAccount/AnonymityLevelSetup';
import { MaxMiningFeeSetup } from '@wallet-components/PrivacyAccount/MaxMiningFeeSetup';
import { SkipRoundsSetup } from './SkipRoundsSetup';
import { selectCoinjoinAccountByKey } from '@wallet-reducers/coinjoinReducer';

const SetupContainer = styled.div`
    padding: 18px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const SetupOptions = styled(Wrapper)`
    align-items: flex-start;
    gap: 24px;
`;

const CustomSetup = styled(Wrapper)`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    gap: 32px;
    margin-top: 24px;
    padding-top: 16px;
`;

interface CoinjoinSetupProps {
    accountKey: string;
}

export const CoinjoinSetup = ({ accountKey }: CoinjoinSetupProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));

    const dispatch = useDispatch();

    if (!coinjoinAccount) {
        return null;
    }

    const hasSession = !!coinjoinAccount.session;

    const handleSetupOptionChange = (isRecommended: boolean) => {
        if (!!coinjoinAccount.customSetup === isRecommended) {
            dispatch(coinjoinAccountUpdateSetupOption(accountKey, isRecommended));
        }
    };
    const setRecommendedSetup = () => handleSetupOptionChange(true);
    const setCustomSetup = () => handleSetupOptionChange(false);

    return (
        <Card customPadding="8px">
            {hasSession && (
                <Warning variant="info">
                    <Translation id="TR_DISABLED_ANONYMITY_CHANGE_MESSAGE" />
                </Warning>
            )}
            <SetupContainer>
                <SetupOptions>
                    <RadioButton
                        isChecked={!coinjoinAccount.customSetup}
                        onClick={setRecommendedSetup}
                        disabled={hasSession}
                    >
                        <Translation id="TR_RECOMMENDED" />
                    </RadioButton>
                    <RadioButton
                        isChecked={coinjoinAccount.customSetup}
                        onClick={setCustomSetup}
                        disabled={hasSession}
                    >
                        <Translation id="TR_CUSTOM" />
                    </RadioButton>
                </SetupOptions>
                <AnimatePresence initial={!coinjoinAccount.customSetup}>
                    {coinjoinAccount.customSetup && (
                        <motion.div
                            {...motionAnimation.expand}
                            transition={{ duration: 0.4, ease: motionEasing.transition }}
                        >
                            <CustomSetup>
                                <AnonymityLevelSetup
                                    accountKey={accountKey}
                                    targetAnonymity={coinjoinAccount.targetAnonymity}
                                />
                                <MaxMiningFeeSetup
                                    accountKey={accountKey}
                                    maxMiningFee={coinjoinAccount.maxFeePerKvbyte}
                                />
                                <SkipRoundsSetup
                                    accountKey={accountKey}
                                    skipRounds={!!coinjoinAccount.skipRounds}
                                />
                            </CustomSetup>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SetupContainer>
        </Card>
    );
};
