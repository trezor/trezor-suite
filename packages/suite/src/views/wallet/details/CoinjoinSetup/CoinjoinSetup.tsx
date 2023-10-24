import { useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { Card, Radio, motionAnimation, motionEasing, Warning } from '@trezor/components';
import { coinjoinAccountUpdateSetupOption } from 'src/actions/wallet/coinjoinAccountActions';
import { AnonymityLevelSetup } from './AnonymityLevelSetup';
import { MaxMiningFeeSetup } from './MaxMiningFeeSetup';
import { SkipRoundsSetup } from './SkipRoundsSetup';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

const SetupContainer = styled.div`
    padding: 18px;
`;

const StyledCard = styled(Card)`
    padding: 8px;
`;

const SetupOptions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
`;

const CustomSetup = styled.div`
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    display: flex;
    flex-direction: column;
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
        if (!!coinjoinAccount.setup === isRecommended) {
            dispatch(coinjoinAccountUpdateSetupOption(accountKey, isRecommended));
        }
    };
    const setRecommendedSetup = () => handleSetupOptionChange(true);
    const setCustomSetup = () => handleSetupOptionChange(false);

    return (
        <StyledCard>
            {hasSession && (
                <Warning variant="info">
                    <Translation id="TR_DISABLED_ANONYMITY_CHANGE_MESSAGE" />
                </Warning>
            )}
            <SetupContainer>
                <SetupOptions>
                    <Radio
                        isChecked={!coinjoinAccount.setup}
                        onClick={setRecommendedSetup}
                        isDisabled={hasSession}
                    >
                        <Translation id="TR_RECOMMENDED" />
                    </Radio>
                    <Radio
                        isChecked={!!coinjoinAccount.setup}
                        onClick={setCustomSetup}
                        isDisabled={hasSession}
                    >
                        <Translation id="TR_CUSTOM" />
                    </Radio>
                </SetupOptions>
                <AnimatePresence initial={!coinjoinAccount.setup}>
                    {coinjoinAccount.setup && (
                        <motion.div
                            {...motionAnimation.expand}
                            transition={{ duration: 0.4, ease: motionEasing.transition }}
                        >
                            <CustomSetup>
                                <AnonymityLevelSetup
                                    accountKey={accountKey}
                                    targetAnonymity={coinjoinAccount.setup.targetAnonymity}
                                />
                                <MaxMiningFeeSetup
                                    accountKey={accountKey}
                                    maxMiningFee={coinjoinAccount.setup.maxFeePerVbyte}
                                />
                                <SkipRoundsSetup
                                    accountKey={accountKey}
                                    skipRounds={coinjoinAccount.setup.skipRounds}
                                />
                            </CustomSetup>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SetupContainer>
        </StyledCard>
    );
};
