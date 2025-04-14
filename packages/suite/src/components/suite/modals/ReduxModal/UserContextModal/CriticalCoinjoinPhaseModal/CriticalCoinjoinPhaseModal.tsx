import { Banner, Card, Column, Divider, LoadingContent, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useCoinjoinSessionPhase } from 'src/hooks/coinjoin';
import { useSelector } from 'src/hooks/suite';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

import { AutoStopButton } from './AutoStopButton';
import { CoinjoinPhaseProgress } from './CoinjoinPhaseProgress';

type CriticalCoinjoinPhaseModalProps = {
    relatedAccountKey: string;
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
        <NewModal
            size="tiny"
            heading={<Translation id="TR_COINJOIN_RUNNING" />}
            description={
                <LoadingContent size={14} isLoading={true}>
                    <Translation id={SESSION_PHASE_MESSAGES[sessionPhase]} />
                </LoadingContent>
            }
        >
            <Column gap={spacings.md} margin={{ top: spacings.xs }}>
                <Banner variant="warning" icon="warning">
                    <Translation id="TR_DO_NOT_DISCONNECT_DEVICE" />
                </Banner>
                <Card>
                    <CoinjoinPhaseProgress
                        roundPhase={roundPhase}
                        phaseDeadline={session?.roundPhaseDeadline}
                    />
                    <Divider margin={{ top: spacings.xl, bottom: spacings.md }} />
                    <AutoStopButton relatedAccountKey={relatedAccountKey} />
                </Card>
            </Column>
        </NewModal>
    );
};
