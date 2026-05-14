import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Banner, Card, Column, Divider, LoadingContent, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useCoinjoinSessionPhase } from 'src/hooks/coinjoin';
import { useSelector } from 'src/hooks/suite';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

import { AutoStopButton } from './AutoStopButton';
import { CoinjoinPhaseProgress } from './CoinjoinPhaseProgress';

type CriticalCoinjoinPhaseModalProps = {
    relatedAccountKey: AccountKey;
};

export const CriticalCoinjoinPhaseModal = ({
    relatedAccountKey,
}: CriticalCoinjoinPhaseModalProps) => {
    const relatedCoinjoinAccount = useSelector(state =>
        selectCoinjoinAccountByKey(state, relatedAccountKey),
    );

    const session = relatedCoinjoinAccount?.session;
    const roundPhase = session?.roundPhase;
    const sessionPhase = useCoinjoinSessionPhase(relatedAccountKey);

    if (!roundPhase || !sessionPhase) {
        return null;
    }

    return (
        <Modal
            width={400}
            heading={<Translation id="TR_COINJOIN_RUNNING" />}
            description={
                <LoadingContent size={16} isLoading={true}>
                    <Translation id={SESSION_PHASE_MESSAGES[sessionPhase]} />
                </LoadingContent>
            }
        >
            <Column gap={spacings.md} margin={{ top: spacings.xs }}>
                <Banner
                    intent="warning"
                    icon="warning"
                    description={<Translation id="TR_DO_NOT_DISCONNECT_DEVICE" />}
                />
                <Card>
                    <CoinjoinPhaseProgress
                        roundPhase={roundPhase}
                        phaseDeadline={session?.roundPhaseDeadline}
                    />
                    <Divider margin={{ top: spacings.xl, bottom: spacings.md }} />
                    <AutoStopButton relatedAccountKey={relatedAccountKey} />
                </Card>
            </Column>
        </Modal>
    );
};
