import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { P } from '@trezor/components';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';
import {
    Translation,
    WordInputAdvanced,
    TrezorLink,
    Modal,
    ModalProps,
} from 'src/components/suite';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
const BottomText = styled.div`
    margin-top: 20px;
`;

interface WordAdvancedModalProps extends ModalProps {
    count: 6 | 9;
}

export const WordAdvancedModal = ({ count, ...rest }: WordAdvancedModalProps) => {
    const intl = useIntl();

    return (
        <Modal
            heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
            description={<Translation id="TR_ADVANCED_RECOVERY_TEXT" />}
            onCancel={() => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED))}
            isCancelable
            totalProgressSteps={5}
            currentProgressStep={4}
            {...rest}
        >
            <ContentWrapper>
                <WordInputAdvanced count={count} />
                <BottomText>
                    <P type="label">
                        <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />{' '}
                        <TrezorLink size="tiny" href={HELP_CENTER_ADVANCED_RECOVERY_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
                    </P>
                </BottomText>
            </ContentWrapper>
        </Modal>
    );
};
