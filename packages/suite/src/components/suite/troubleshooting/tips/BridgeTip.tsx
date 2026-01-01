import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
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
