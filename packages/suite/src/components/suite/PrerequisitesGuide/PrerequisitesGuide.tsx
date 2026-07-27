import { motion } from 'framer-motion';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    deviceNeedsAttention,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { Column, Illustration, Paragraph, Text, motionEasing } from '@trezor/components';

import { getMessageId } from 'src/components/suite/getMessageId';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { BannerAndTroubleshooting } from './BannerAndTroubleshooting';

type PrerequisitesGuideProps = {
    showDeviceImage?: boolean;
};

const TopAnimation = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: -0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: motionEasing.enter }}
        data-testid="@connect-device-prompt"
    >
        {children}
    </motion.div>
);

const BottomAnimation = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
    >
        {children}
    </motion.div>
);

export const PrerequisitesGuide = ({ showDeviceImage = true }: PrerequisitesGuideProps) => {
    const device = useSelector(selectSelectedDevice);
    const deviceStatus = device ? getStatus(device) : null;
    const prerequisite = useSelector(selectPrerequisite);

    const showWarning =
        !!(device && deviceStatus && deviceNeedsAttention(deviceStatus)) ||
        prerequisite === 'no-transport';
    const showWarningIcon = shouldDisplayInitialWarningIcon(deviceStatus);

    const texts = getMessageId({
        connected: !!device,
        showWarning: showWarningIcon ?? showWarning,
        deviceStatus,
        prerequisite,
    });

    return (
        <>
            <TopAnimation>
                <Column alignItems="center">
                    {showDeviceImage && <Illustration name="connectTrezor" width={350} />}
                    <Text typographyStyle="headline-md" textWrap="balance" align="center">
                        <Translation id={texts.heading} />
                    </Text>
                    {texts.description && (
                        <Paragraph
                            intent="neutral"
                            priority="secondary"
                            align="center"
                            margin={{ top: 12 }}
                        >
                            <Translation id={texts.description} />
                        </Paragraph>
                    )}
                </Column>
            </TopAnimation>
            <BottomAnimation>
                <BannerAndTroubleshooting prerequisite={prerequisite} />
            </BottomAnimation>
        </>
    );
};
