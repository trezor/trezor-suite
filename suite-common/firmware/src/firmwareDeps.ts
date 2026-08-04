import { type Getter } from '@suite-common/dependency-injection';

export type GetDesktopBinDirDep = {
    getDesktopBinDir: Getter<[], string | undefined>;
};
