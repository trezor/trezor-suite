/* eslint-disable react/no-danger */
import { useDocs } from '../hooks/useDocs';

export const Changelog = () => {
    const docs = useDocs(
        `https://raw.githubusercontent.com/trezor/trezor-suite/${process.env.COMMIT_HASH}/packages/connect/CHANGELOG.md`,
    );

    return (
        <section>
            <a href="https://www.npmjs.org/package/@trezor/connect-web" rel="nofollow">
                <img
                    src="https://img.shields.io/npm/v/%40trezor/connect-web/latest?label=connect-web"
                    alt="NPM"
                />
            </a>
            &nbsp;
            <a href="https://www.npmjs.org/package/@trezor/connect" rel="nofollow">
                <img
                    src="https://img.shields.io/npm/v/%40trezor/connect/latest?label=connect"
                    alt="NPM"
                />
            </a>
            <div dangerouslySetInnerHTML={{ __html: docs! }} className="docs-container" />
        </section>
    );
};
