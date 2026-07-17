import { Column, H3, InfoItem, Link, Modal } from '@trezor/components';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';
export const Version = () => (
    <Modal data-testid="@modal/version" width={600}>
        <Column gap={20}>
            <InfoItem label="Application version">
                <H3 data-testid="@version/number">{getSuiteVersion()}</H3>
            </InfoItem>
            <InfoItem label="Last commit hash">
                <Link
                    href={`https://github.com/trezor/trezor-suite/commits/${getCommitHash()}`}
                    data-testid="@version/commit-hash-link"
                >
                    <H3>{getCommitHash()}</H3>
                </Link>
            </InfoItem>
        </Column>
    </Modal>
);
