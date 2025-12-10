import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

export const SuiteDesktopTip = () => {
    const handleClick = useOpenSuiteDesktop();

    return (
        <Translation
            id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" onClick={handleClick}>
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    );
};
