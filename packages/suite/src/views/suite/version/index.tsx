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
    <Modal data-testid="@modal/version">
        <Wrapper>
            <Paragraph typographyStyle="callout">APPLICATION VERSION</Paragraph>
            <H2 data-testid="@version/number">{getSuiteVersion()}</H2>
            <Line />
            <Paragraph typographyStyle="callout">LAST COMMIT HASH</Paragraph>
            <Link
                href={`https://github.com/trezor/trezor-suite/commits/${getCommitHash()}`}
                data-testid="@version/commit-hash-link"
            >
                <H2>{getCommitHash()}</H2>
            </Link>
        </Wrapper>
    </Modal>
);
