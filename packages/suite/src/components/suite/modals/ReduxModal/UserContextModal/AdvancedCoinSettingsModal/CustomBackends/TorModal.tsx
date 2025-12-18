import { H3, Modal, Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getIsTorLoading } from 'src/utils/suite/tor';

export type TorResult = 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => {
    const isTorLoading = useSelector(state => getIsTorLoading(state.suite.torStatus));

    return (
        <Modal
            bottomContent={
                <>
                    {isDesktop() && (
                        <Modal.Button
                            isLoading={isTorLoading}
                            onClick={() => onResult('enable-tor')}
                        >
                            <Translation id="TR_TOR_ENABLE_AND_CONFIRM" />
                        </Modal.Button>
                    )}
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onResult('use-defaults')}
                    >
                        <Translation id="TR_USE_DEFAULT_BACKENDS" />
                    </Modal.Button>
                </>
            }
            width={600}
            iconName="torBrowser"
        >
            <H3>
                <Translation id="TR_TOR_ENABLE" />
            </H3>
            <Paragraph variant="tertiary">
                <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
            </Paragraph>
        </Modal>
    );
};
