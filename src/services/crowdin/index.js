const fs = require('fs');
const { ensureDirSync } = require('fs-extra');
const path = require('path');
const request = require('request-promise-native');
const extractZip = require('extract-zip');

class Crowdin {
    constructor(projectId, apiKey) {
        this.projectId = projectId;
        this.apiKey = apiKey;
    }

    /*
        Upload a new csv file to Crowdin service
        https://support.crowdin.com/api/add-file/
    */
    addFile(filePath, scheme, branch = null) {
        const newMasterCsv = fs.createReadStream(filePath);
        const params = {
            method: 'POST',
            uri: `https://api.crowdin.com/api/project/${this.projectId}/add-file`,
            qs: { key: this.apiKey },
            formData: {
                first_line_contains_header: '',
                escape_quotes: '0',
                json: '',
                scheme,
            },
        };
        if (branch) params.qs.branch = branch;
        const filename = path.parse(filePath).base;
        // files: Array keys should contain file names with path in Crowdin project.
        params.formData[`files[${filename}]`] = newMasterCsv;
        const req = request(params);
        return req;
    }

    /*
        Update an existing csv file in Crowdin service
        https://support.crowdin.com/api/update-file/
    */
    updateFile(filePath, branch = null) {
        const newMasterCsv = fs.createReadStream(filePath);
        const params = {
            method: 'POST',
            uri: `https://api.crowdin.com/api/project/${this.projectId}/update-file`,
            qs: { key: this.apiKey },
            formData: {
                first_line_contains_header: '',
                update_option: 'update_as_unapproved',
                escape_quotes: '0',
                json: '',
            },
        };
        if (branch) params.qs.branch = branch;
        const filename = path.parse(filePath).base;
        params.formData[`files[${filename}]`] = newMasterCsv; // Array keys should contain file names with path in Crowdin project.
        const req = request(params);
        return req;
    }

    /*
        Builds translations in Crowdin service. It does not actually download anything.
        This method can be invoked only once per 30 minutes.
        Translations might be downloaded in separate API call later.
        https://support.crowdin.com/api/export/
    */
    buildTranslations(branch = null) {
        const qs = { key: this.apiKey, json: '' };
        if (branch) qs.branch = branch;
        return (
            request.get(`https://api.crowdin.com/api/project/${this.projectId}/export`, { qs })
        );
    }

    /*
        Downloads a ZIP file with translations.
        https://support.crowdin.com/api/download/
    */
    downloadTranslationsZip(branch = null) {
        const qs = { key: this.apiKey };
        if (branch) qs.branch = branch;
        return request.get(`https://api.crowdin.com/api/project/${this.projectId}/download/all.zip`, { encoding: null, qs });
    }

    /*
        Downloads a ZIP file with translations and extracts files to exportDir
    */
    async exportTranslations(exportDir, branch = null) {
        ensureDirSync(exportDir);
        const exportDirAbs = path.resolve(exportDir);
        const zipFilePath = path.join(exportDir, 'temp.zip');
        // download builded translations
        const data = await this.downloadTranslationsZip(branch);
        fs.writeFileSync(zipFilePath, data);
        // extract zip
        return new Promise((resolve, reject) => {
            extractZip(zipFilePath, { dir: exportDirAbs }, (err) => {
                if (err) return reject(err);
                // delete downloaded zip file
                fs.unlinkSync(zipFilePath);
                return resolve();
            });
        });
    }

    /*
        Creates a new branch in Crowdin service
        https://support.crowdin.com/api/add-file/
    */
    createBranch(branch) {
        return request.post(
            `https://api.crowdin.com/api/project/${this.projectId}/add-directory?key=${this.apiKey}`,
            {
                qs: {
                    is_branch: 1,
                    name: branch,
                },
            },
        );
    }
}

export default Crowdin;
