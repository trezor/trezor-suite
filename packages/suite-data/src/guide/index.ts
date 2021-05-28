import * as fs from 'fs-extra';
import simpleGit from 'simple-git';
import { TMP, GITBOOK_SOURCE, GITBOOK_REVISION } from './constants';
import { Parser } from './parser';

/**
 * Clears the @param destination directory and then populates it with
 * content of the @param repository checked out at @param revision commit.
 */
const fetchSource = async (repository: string, revision: string, destination: string) => {
    fs.removeSync(TMP);
    fs.mkdirpSync(TMP);
    // Run all subsequent git commands in the TMP directory.
    const git = simpleGit({ baseDir: destination });
    await git.clone(repository, '.');
    await git.checkout(revision);
};

const main = async () => {
    // Fetch content from GitBook mirror.
    await fetchSource(GITBOOK_SOURCE, GITBOOK_REVISION, TMP);
    // Parse content tree.
    const parser = new Parser(TMP);
    const index = parser.parse();

    console.log(JSON.stringify(index, undefined, 2));
};

main();
