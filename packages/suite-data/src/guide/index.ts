import * as fs from 'fs-extra';
import simpleGit from 'simple-git';
import { TMP, GITBOOK_SOURCE, GITBOOK_REVISION } from './constants';

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

fetchSource(GITBOOK_SOURCE, GITBOOK_REVISION, TMP);
