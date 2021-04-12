/* eslint-disable camelcase */
import fs from 'fs';
import { ensureDirSync } from 'fs-extra';
import * as path from 'path';
import request from 'request-promise-native';
import extractZip from 'extract-zip';

interface FormData {
    files: {
        [key: string]: string;
    };
    first_line_contains_header?: string;
    escape_quotes?: string;
    json?: string;
    branch?: string;
}

interface QueryString {
    key?: string;
    json?: string;
    branch?: string;
    login?: string;
    'account-key'?: string;
}

interface AddFormData extends FormData {
    scheme: string;
}

interface UpdateFormData extends FormData {
    update_option: 'update_as_unapproved';
}

interface AccessKey {
    key: string;
}
interface AccountKey {
    login: string;
    'account-key': string;
}

type Access = AccessKey | AccountKey;

class Crowdin {
    projectId: string;
    access: Access;

    constructor(projectId: string, apiKey: string, login?: string) {
        this.projectId = projectId;
        if (login) {
            this.access = { 'account-key': apiKey, login };
        } else {
            this.access = { key: apiKey };
        }
    }

    /*
        Upload a new csv file to Crowdin service
        https://support.crowdin.com/api/add-file/
    */
    addFile = (filePath: string, scheme: string, branch: string | undefined = undefined) => {
        const newMasterCsv = fs.createReadStream(filePath);
        const formData: Partial<AddFormData> = {
            first_line_contains_header: '',
            escape_quotes: '0',
            json: '',
            scheme,
        };

        const qs: QueryString = { ...this.access };

        if (branch) qs.branch = branch;
        const filename = path.parse(filePath).base;
        // files: Array keys should contain file names with path in Crowdin project.
        // @ts-ignore
        formData[`files[${filename}]`] = newMasterCsv;
        const req = request({
            method: 'POST',
            uri: `https://api.crowdin.com/api/project/${this.projectId}/add-file`,
            qs,
            formData,
        });
        return req;
    };

    /*
        Update an existing csv file in Crowdin service
        https://support.crowdin.com/api/update-file/
    */
    updateFile = (filePath: string, branch: string | undefined = undefined) => {
        const newMasterCsv = fs.createReadStream(filePath);

        const formData: Partial<UpdateFormData> = {
            first_line_contains_header: '',
            update_option: 'update_as_unapproved',
            escape_quotes: '0',
            json: '',
        };
        const qs: QueryString = { ...this.access };
        if (branch) qs.branch = branch;
        const filename = path.parse(filePath).base;
        // @ts-ignore
        formData[`files[${filename}]`] = newMasterCsv; // Array keys should contain file names with path in Crowdin project.
        const req = request({
            method: 'POST',
            uri: `https://api.crowdin.com/api/project/${this.projectId}/update-file`,
            qs,
            formData,
        });
        return req;
    };

    /*
        Builds translations in Crowdin service. It does not actually download anything.
        This method can be invoked only once per 30 minutes.
        Translations might be downloaded in separate API call later.
        https://support.crowdin.com/api/export/
    */
    buildTranslations = (branch: string | undefined = undefined) => {
        const qs: QueryString = { ...this.access, json: '' };
        if (branch) qs.branch = branch;
        return request.get(`https://api.crowdin.com/api/project/${this.projectId}/export`, { qs });
    };

    /*
        Downloads a ZIP file with translations.
        https://support.crowdin.com/api/download/
    */
    downloadTranslationsZip = (branch: string | undefined = undefined) => {
        const qs: QueryString = { ...this.access };
        if (branch) qs.branch = branch;
        return request.get(
            `https://api.crowdin.com/api/project/${this.projectId}/download/all.zip`,
            { encoding: null, qs },
        );
    };

    /*
        Downloads a ZIP file with translations and extracts files to exportDir
    */
    exportTranslations = async (exportDir: string, branch: string | undefined = undefined) => {
        ensureDirSync(exportDir);
        const exportDirAbs = path.resolve(exportDir);
        const zipFilePath = path.join(exportDir, 'temp.zip');
        // download builded translations
        const data = await this.downloadTranslationsZip(branch);
        fs.writeFileSync(zipFilePath, data);
        // extract zip
        return new Promise<void>((resolve, reject) => {
            extractZip(zipFilePath, { dir: exportDirAbs }, err => {
                if (err) return reject(err);
                // delete downloaded zip file
                fs.unlinkSync(zipFilePath);
                return resolve();
            });
        });
    };

    /*
        Creates a new branch in Crowdin service
        https://support.crowdin.com/api/add-file/
    */
    createBranch = (branch: string) =>
        request.post(`https://api.crowdin.com/api/project/${this.projectId}/add-directory`, {
            qs: {
                ...this.access,
                is_branch: 1,
                name: branch,
            },
        });
}

export default Crowdin;
