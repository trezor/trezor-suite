import { Translation } from '@suite/intl';
import { getIsTorLoading } from '@suite/tor';
import { H3, Modal, Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { useSelector } from 'src/hooks/suite/useSelector';

export type TorResult = 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => {
    const isTorLoading = useSelector(state => getIsTorLoading(state.tor.torStatus));

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
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
            </Paragraph>
        </Modal>
    );
};
