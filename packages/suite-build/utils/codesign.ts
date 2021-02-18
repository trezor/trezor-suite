import fs from 'fs';
import { isCodesignBuild } from './env';

console.log(`Bundling ${isCodesignBuild ? 'production' : 'develop'} public key.`);
const JWS_PUBLIC_KEY = isCodesignBuild
    ? fs.readFileSync(process.env.JWS_PUBLIC_KEY_FILE ?? '', 'utf-8')
    : `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`;

export default JWS_PUBLIC_KEY;
