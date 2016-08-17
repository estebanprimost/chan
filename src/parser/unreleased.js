const MARKERS = {
    INITIAL: 0,
    UNRELEASED: 3
};

const LINE = '\n';
const BREAK = LINE + LINE;

const TPL = {
    H3: '### <text>',
    VERSION: '## [<version>] - <date>',
    LI: '- <text>'
};

function cantToDelete(children) {
    let i = 0;
    const list = children.slice(MARKERS.UNRELEASED);
    for (let len = list.length; i < len; i++) {
        if (list[i].type === 'heading' && list[i].depth === 2) {
            break;
        }
    }
    return i;
}

function decode(children, stringify) {
    const nodes = [];
    let node;
    for (let elem of children.slice(MARKERS.UNRELEASED)) {
        if (elem.type === 'heading' && elem.depth === 2) {
            break;
        }

        if (elem.type === 'heading') {
            node = {};
            node.text = stringify(elem.children[0]);
            node.children = [];
            nodes.push(node);
        } else  {
            for (let li of elem.children) {
                node.children.push({
                    text: stringify(li.children[0])
                });
            }
        }
    }

    return {
        start: MARKERS.UNRELEASED,
        nodes: nodes.sort((a, b) => a.text.localeCompare(b.text))
    };
}

function encode(children, m, version = null) {
    let tpl = this.nodes.map((node) => {
        return TPL.H3.replace('<text>', node.text) + LINE + node.children.reduce((result, li) => {
            return result + LINE + TPL.LI.replace('<text>', li.text);
        }, '');
    }).join(BREAK);

    if (version) {
        const now = new Date();
        const date = [
            now.getFullYear(),
            '-', ('0' + (now.getMonth() + 1)).slice(-2),
            '-', ('0' + now.getDate()).slice(-2)
        ].join('');
        tpl = TPL.VERSION
            .replace('<version>', version)
            .replace('<date>', date) +
            LINE +
            tpl;
        debugger;
    }

    children.splice(MARKERS.UNRELEASED, cantToDelete(children), ...m(tpl));

    return tpl;
}

function findHeaderOrCreate(type) {
    let node;
    for (let value of this.nodes) {
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

        this.nodes.push(node);

        this.nodes.sort((a, b) => a.text.localeCompare(b.text));
    }

    return node;
}

export default function unreleased(parser) {
    const that = Object.assign({}, decode(parser.root.children, parser.stringify));

    that.encode = function () {
        return encode.call(this, parser.root.children, parser.createMDAST);
    };

    that.release = function (version) {
        return encode.call(this, parser.root.children, parser.createMDAST, version);
    };

    that.insert = function (type, value) {
        const node = findHeaderOrCreate.call(this, type);
        node.children.push({
            text: value
        });
        that.encode();
    };

    return that;
}
