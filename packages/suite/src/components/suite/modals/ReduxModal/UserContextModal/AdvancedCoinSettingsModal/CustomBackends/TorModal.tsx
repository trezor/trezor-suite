import { H3, NewModal, Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getIsTorLoading } from 'src/utils/suite/tor';

export type TorResult = 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => {
    const isTorLoading = useSelector(state => getIsTorLoading(state.suite.torStatus));

    return (
        <NewModal
            bottomContent={
                <>
                    {isDesktop() && (
                        <NewModal.Button
                            isLoading={isTorLoading}
                            onClick={() => onResult('enable-tor')}
                        >
                            <Translation id="TR_TOR_ENABLE_AND_CONFIRM" />
                        </NewModal.Button>
                    )}
                    <NewModal.Button variant="tertiary" onClick={() => onResult('use-defaults')}>
                        <Translation id="TR_USE_DEFAULT_BACKENDS" />
                    </NewModal.Button>
                </>
            }
            size="small"
            iconName="torBrowser"
        >
            <H3>
                <Translation id="TR_TOR_ENABLE" />
            </H3>
            <Paragraph variant="tertiary">
                <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
            </Paragraph>
        </NewModal>
    );
};
