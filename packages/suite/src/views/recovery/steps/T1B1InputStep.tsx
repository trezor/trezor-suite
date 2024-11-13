import { Paragraph } from '@trezor/components';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';

import { Translation, TrezorLink, WordInput, WordInputAdvanced } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { MODAL } from 'src/actions/suite/constants';

const RequestConfirmationStep = () => (
    <Paragraph>
        <Translation id="TR_CONFIRM_ACTION_ON_YOUR" />
    </Paragraph>
);

type WordAdvancedStepProps = { count: 6 | 9 };

const WordAdvancedStep = ({ count }: WordAdvancedStepProps) => (
    <>
        <WordInputAdvanced count={count} />
        <Paragraph typographyStyle="label">
            <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />{' '}
            <TrezorLink type="label" href={HELP_CENTER_ADVANCED_RECOVERY_URL}>
                <Translation id="TR_LEARN_MORE" />
            </TrezorLink>
        </Paragraph>
    </>
);

const WordStep = () => (
    <>
        <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
        <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
        <WordInput />
    </>
);

export const T1B1InputStep = () => {
    const modal = useSelector(state => state.modal);

    if (modal.context !== MODAL.CONTEXT_DEVICE) return null;

    switch (modal.windowType) {
        case 'ButtonRequest_Other':
            return <RequestConfirmationStep />;
        case 'WordRequestType_Plain':
            return <WordStep />;
        case 'WordRequestType_Matrix6':
            return <WordAdvancedStep count={6} />;
        case 'WordRequestType_Matrix9':
            return <WordAdvancedStep count={9} />;
        // to satisfy TS, should not happen
        default:
            return null;
    }
};
