import { useDispatch } from 'react-redux';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { AccountKey } from '@suite-common/wallet-types';
import {
    Banner,
    Card,
    Radio,
    motionAnimation,
    motionEasing,
    useElevation,
} from '@trezor/components';
import { Elevation, mapElevationToBorder } from '@trezor/theme';

import { coinjoinAccountUpdateSetupOption } from 'src/actions/wallet/coinjoinAccountActions';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

import { AnonymityLevelSetup } from './AnonymityLevelSetup';
import { MaxMiningFeeSetup } from './MaxMiningFeeSetup';
import { SkipRoundsSetup } from './SkipRoundsSetup';

const SetupContainer = styled.div`
    padding: 18px;
`;

const SetupOptions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
`;

const CustomSetup = styled.div<{ $elevation: Elevation }>`
    border-top: 1px solid ${mapElevationToBorder};
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 24px;
    padding-top: 16px;
`;

interface CoinjoinSetupProps {
    accountKey: AccountKey;
}

export const CoinjoinSetup = ({ accountKey }: CoinjoinSetupProps) => {
    const { elevation } = useElevation();
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
        <Card>
            {hasSession && (
                <Banner
                    intent="info"
                    description={<Translation id="TR_DISABLED_ANONYMITY_CHANGE_MESSAGE" />}
                />
            )}
            <SetupContainer>
                <SetupOptions>
                    <Radio
                        isChecked={!coinjoinAccount.setup}
                        onChange={setRecommendedSetup}
                        isDisabled={hasSession}
                    >
                        <Translation id="TR_RECOMMENDED" />
                    </Radio>
                    <Radio
                        isChecked={!!coinjoinAccount.setup}
                        onChange={setCustomSetup}
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
                            <CustomSetup $elevation={elevation}>
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
        </Card>
    );
};
