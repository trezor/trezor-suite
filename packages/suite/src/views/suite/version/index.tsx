import styled from 'styled-components';
import { Link, H2, P } from '@trezor/components';
import { Modal } from 'src/components/suite';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Line = styled.div`
    padding: 20px;
`;

export const Version = () => (
    <Modal data-test="@modal/version">
        <Wrapper>
            <P type="callout">APPLICATION VERSION</P>
            <H2 data-test="@version/number">{getSuiteVersion()}</H2>
            <Line />
            <P type="callout">LAST COMMIT HASH</P>
            <Link
                href={`https://github.com/trezor/trezor-suite/commits/${getCommitHash()}`}
                data-test="@version/commit-hash-link"
            >
                <H2>{getCommitHash()}</H2>
            </Link>
        </Wrapper>
    </Modal>
);
