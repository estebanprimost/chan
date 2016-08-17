import path from 'path';
import remark from 'remark';
import removePosition from 'unist-util-remove-position';
import { read, write } from './fs';
import emptySpaces from './empty-spaces';
import unreleased from './unreleased';

const MARKERS = {
    INITIAL: 0,
    UNRELEASED: 3,
    CHANGES: 4
};

const SEPARATORS = {
    Added: 'Added',
    Changed: 'Changed',
    Fixed: 'Fixed',
    Security: 'Security',
    Deprecated: 'Deprecated',
    Removed: 'Removed'
};

const HEADINGS = new Set(Object.keys(SEPARATORS));

const remarkInstance = remark().use(emptySpaces);

let _unreleased;

export default function parser(dir = process.cwd()) {
    const pathname = path.resolve(dir, 'CHANGELOG.md');
    const contents = read(pathname);
    return {
        remark: remarkInstance,
        MARKERS,
        SEPARATORS,
        HEADINGS,
        root: removePosition(remarkInstance.parse(contents), true),
        createMDAST(value) {
            const result = removePosition(remarkInstance.parse(value), true);
            if (result.children.length === 1) {
                return result.children[0];
            }
            return result.children;
        },
        exists() {
            return contents !== null;
        },
        write(content = this.stringify()) {
            return write(pathname, content);
        },
        stringify(root = this.root) {
            return remarkInstance.stringify(root);
        },
        getUnreleased() {
            if (_unreleased) {
                return _unreleased;
            }
            _unreleased = unreleased(this);
            return _unreleased;
        },
        change(type, value) {
            this.getUnreleased().insert(type, value);
        },
        release(version) {
            this.getUnreleased().release(version);
        }
    };
}
