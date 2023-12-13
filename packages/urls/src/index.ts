import type * as Urls from './urls';
import type * as GithubUrls from './github';

export * from './urls';
export * from './github';
export * from './tor';

export type Url = (typeof Urls)[keyof typeof Urls] | (typeof GithubUrls)[keyof typeof GithubUrls];
