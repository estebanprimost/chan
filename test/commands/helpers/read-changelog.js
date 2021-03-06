import path from 'path';
import fs from 'fs';

export default function readChangelog(name) {
    const pathname = path.normalize(`${name}/CHANGELOG.md`);
    return new Promise((resolve, reject) => {
        fs.readFile(pathname, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
