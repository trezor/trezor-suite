import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { typography } from '@trezor/theme';
import styled from 'styled-components';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

export const BridgeInstall = () => {
    const handleClick = useOpenSuiteDesktop();

    return (
        <Wrapper>
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
        </Wrapper>
    );
};
