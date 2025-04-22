import { Column, H3, InfoItem, Link, Modal } from '@trezor/components';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

export const Version = () => (
    <Modal data-testid="@modal/version" size="small">
        <Column gap={spacings.lg}>
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
