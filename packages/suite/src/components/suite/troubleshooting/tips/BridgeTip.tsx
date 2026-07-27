import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';

import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

export const SuiteDesktopTip = () => {
    const handleClick = useOpenSuiteDesktop();

    return (
        <Translation
            id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_DESCRIPTION"
            values={{
                a: chunks => <TrezorLink onClick={handleClick}>{chunks}</TrezorLink>,
            }}
        />
    );
};
