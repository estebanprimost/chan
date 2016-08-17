import now from './lib/now';

const MARKERS = {
    INITIAL: 0,
    UNRELEASED: 2
};

const STAGES = {
    RELEASE: 0,
    REFS: 1
};

const LINE = '\n';
const BREAK = LINE + LINE;

const TPL = {
    UNRELEASED: '## [Unreleased]',
    H3: '### <text>',
    VERSION: '## [<version>] - <date>',
    LI: '- <text>'
};

function processRelease(release, node, elem, stringify) {
    if (elem.type === 'heading') {
        node = {};
        node.text = stringify(elem.children[0]);
        node.children = [];
        release.nodes.push(node);
    } else  {
        for (let li of elem.children) {
            node.children.push({
                text: stringify(li.children[0])
            });
        }
    }

    return node;
}

function decode(children, stringify) {
    const that = {
        releases: [
            {
                text: TPL.UNRELEASED,
                start: MARKERS.UNRELEASED,
                nodes: []
            }
        ],
        refs: []
    };

    let node;
    let pos = MARKERS.UNRELEASED;
    let currentStage = STAGES.RELEASE;

    for (let elem of children.slice(MARKERS.UNRELEASED + 1)) {
        if (elem.type === 'heading' && elem.depth === 2) {
            const release = {
                text: stringify(elem),
                start: pos,
                nodes: []
            };
            that.releases.push(release);
            pos++;
            continue;
        }

        if (currentStage === STAGES.RELEASE) {
            node = processRelease(that.releases[that.releases.length - 1], node, elem, stringify);
        }
        pos++;
    }

    return that;
}

function compileRelease(release = 0, children, m, version = null) {
    let tpl = this.releases[release].nodes.map((node) => {
        return TPL.H3.replace('<text>', node.text) + LINE + node.children.reduce((result, li) => {
            return result + LINE + TPL.LI.replace('<text>', li.text);
        }, '');
    }).join(BREAK);

    if (version) {
        tpl = TPL.UNRELEASED +
            LINE +
            TPL.VERSION
            .replace('<version>', version)
            .replace('<date>', now()) +
            LINE +
            tpl;
    } else {
        tpl = this.releases[release].text + LINE + tpl;
    }

    const end = this.releases[release + 1] ?
        this.releases[release + 1].start - this.releases[release].start :
        children.length - this.releases[release].start;

    const tplParsed = m(tpl);
    children.splice(this.releases[release].start, end + 1, ...tplParsed);

    if (this.releases[release + 1]) {
        this.releases[release + 1].start = this.releases[release].start + tplParsed.length;
    }

    return tpl;
}

function findHeaderOrCreate(type) {
    let node;
    for (let value of this.releases[0].nodes) {
        if (value.text.toLowerCase().trim() === type.toLowerCase().trim()) {
            node = value;
            break;
        }
    }
    if (!node) {
        const text = type.toLowerCase().trim();
        node = {
            text: text[0].toUpperCase() + text.substr(1, text.length),
            children: []
        };

        this.releases[0].nodes.push(node);

        this.releases[0].nodes.sort((a, b) => a.text.localeCompare(b.text));
    }

    return node;
}

export default function mtree(parser) {
    const that = Object.assign({}, decode(parser.root.children, parser.stringify));

    that.compileRelease = function (release) {
        return compileRelease.call(this, release, parser.root.children, parser.createMDAST);
    };

    that.compileUnreleased = function () {
        return that.compileRelease(0);
    };

    that.version = function (version) {
        return compileRelease.call(this, 0, parser.root.children, parser.createMDAST, version);
    };

    that.insert = function (type, value) {
        const node = findHeaderOrCreate.call(this, type);
        node.children.push({
            text: value
        });
        that.compileUnreleased();
    };

    return that;
}
