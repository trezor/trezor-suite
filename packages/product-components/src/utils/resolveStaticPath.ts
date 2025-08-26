export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = typeof process !== 'undefined' ? process.env.ASSET_PREFIX : '',
) => `${pathPrefix || ''}/static/${path.replace(/^\/+/, '')}`;
