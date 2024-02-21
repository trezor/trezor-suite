import styled from 'styled-components';
import { Link, H2, Paragraph } from '@trezor/components';
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
    <Modal data-test-id="@modal/version">
        <Wrapper>
            <Paragraph type="callout">APPLICATION VERSION</Paragraph>
            <H2 data-test-id="@version/number">{getSuiteVersion()}</H2>
            <Line />
            <Paragraph type="callout">LAST COMMIT HASH</Paragraph>
            <Link
                href={`https://github.com/trezor/trezor-suite/commits/${getCommitHash()}`}
                data-test-id="@version/commit-hash-link"
            >
                <H2>{getCommitHash()}</H2>
            </Link>
        </Wrapper>
    </Modal>
);
