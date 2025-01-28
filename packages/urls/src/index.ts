import * as GithubUrls from './github';
import * as Urls from './urls';

export * from './urls';
export * from './github';
export * from './tor';
export * from './deeplinks';

type AllUrls = typeof Urls & typeof GithubUrls;
export type Url = AllUrls[keyof AllUrls];
