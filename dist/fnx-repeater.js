/**
 * FNXRepeater - Filament 5.11+ HasJsRenderer field.
 * Native-style repeater cards, client-side local editing, deferred Livewire sync.
 * This file is an ES module, loaded on demand through FilamentAsset.
 */

const LABELS = Object.freeze({
    add: 'Add to items', empty: 'No items yet.', items: 'items', item: 'Item',
    duplicate: 'Duplicate', undo: 'Undo', delete: 'Delete', moveUp: 'Move up',
    moveDown: 'Move down', drag: 'Drag to reorder', collapse: 'Collapse',
    expand: 'Expand', collapseAll: 'Collapse all', expandAll: 'Expand all',
    previous: 'Previous', next: 'Next', page: 'Page', showing: 'Showing', of: 'of',
    rowsPerPage: 'Rows per page', maxReached: 'Maximum number of items reached.',
    minReached: 'Minimum number of items reached.', actions: 'Actions',
});

const TYPES = new Set(['text', 'email', 'textarea', 'number', 'select', 'checkbox']);
const SVG = {
    plus: ['M12 4.5v15m7.5-7.5h-15'],
    copy: ['M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2', 'M10 8h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z'],
    trash: ['M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6'],
    up: ['m5 15 7-7 7 7'], down: ['m5 9 7 7 7-7'],
    left: ['m15 18-6-6 6-6'], right: ['m9 18 6-6-6-6'],
    grip: ['M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01'],
    undo: ['M9 14 4 9l5-5', 'M4 9h9a7 7 0 0 1 0 14h-3'],
    chevronsUp: ['m7 11 5-5 5 5m-10 7 5-5 5 5'],
    chevronsDown: ['m7 6 5 5 5-5m-10 7 5 5 5-5'],
};

export function normaliseConfiguration(source = {}) {
    const cols = Array.isArray(source.columns) ? source.columns : [];
    const pageSize = Math.max(5, Math.min(100, Number(source.pageSize) || 25));
    const minItems = Math.max(0, Number(source.minItems) || 0);
    const maxItems = Math.max(minItems, Math.min(10000, Number(source.maxItems ?? 2000)));
    return {
        columns: cols.filter((column) => column && /^[a-zA-Z][a-zA-Z\d_]*$/.test(column.name || ''))
            .map((column) => ({
                name: column.name, label: String(column.label || column.name),
                type: TYPES.has(column.type) ? column.type : 'text',
                placeholder: String(column.placeholder ?? ''),
                required: Boolean(column.required), readOnly: Boolean(column.readOnly),
                default: column.default ?? (column.type === 'checkbox' ? false : null),
                min: column.min ?? null, max: column.max ?? null, step: column.step ?? null,
                maxLength: column.maxLength ?? null,
                options: column.options && typeof column.options === 'object' ? column.options : {},
            })),
        pageSize, minItems, maxItems,
        gridColumns: Math.max(1, Math.min(4, Number(source.gridColumns) || 2)),
        addable: source.addable !== false, deletable: source.deletable !== false,
        duplicable: source.duplicable !== false, reorderable: source.reorderable !== false,
        draggable: source.draggable !== false, moveButtons: source.moveButtons !== false,
        collapsible: source.collapsible !== false, collapsed: Boolean(source.collapsed),
        itemNumbers: source.itemNumbers !== false,
        itemLabelColumn: typeof source.itemLabelColumn === 'string' ? source.itemLabelColumn : null,
        addLabel: typeof source.addLabel === 'string' ? source.addLabel : null,
        labels: { ...LABELS, ...(source.labels || {}) },
    };
}

export function blankRow(columns) {
    return Object.fromEntries(columns.map((col) => [col.name,
        col.default ?? (col.type === 'checkbox' ? false : col.type === 'number' ? null : ''),
    ]));
}

export function normaliseRows(value, columns) {
    if (!Array.isArray(value)) return [];
    return value.filter((row) => row && typeof row === 'object' && !Array.isArray(row)).map((row) => {
        const output = {};
        for (const col of columns) {
            const supplied = Object.prototype.hasOwnProperty.call(row, col.name) ? row[col.name] : col.default;
            if (col.type === 'checkbox') output[col.name] = supplied === true || supplied === 1 || supplied === '1';
            else if (col.type === 'number') output[col.name] = supplied === null || supplied === undefined || supplied === ''
                ? null : Number.isFinite(Number(supplied)) ? Number(supplied) : null;
            else output[col.name] = supplied == null ? '' : String(supplied);
        }
        return output;
    });
}

export function moveRow(rows, from, to) {
    if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows;
    const result = [...rows];
    result.splice(to, 0, ...result.splice(from, 1));
    return result;
}

function element(tag, classes = '', content = null) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (content !== null) el.textContent = String(content);
    return el;
}

function svgIcon(name) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '18');
    icon.setAttribute('height', '18');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    for (const path of SVG[name] || []) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', path);
        icon.append(el);
    }
    return icon;
}

function iconButton(label, name, action, disabled = false) {
    const button = element('button', 'fnx-r-icon-btn');
    button.type = 'button';
    button.disabled = disabled;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.append(svgIcon(name));
    button.addEventListener('click', action);
    return button;
}

function actionButton(label, action, disabled = false) {
    const button = element('button', 'fnx-r-add');
    button.type = 'button';
    button.disabled = disabled;
    button.append(svgIcon('plus'), document.createTextNode(label));
    button.addEventListener('click', action);
    return button;
}

export default function mountFNXRepeater({ host, props: initialProps }) {
    let props = initialProps;
    let configurationSnapshot = JSON.stringify(props.configuration || {});
    let config = normaliseConfiguration(props.configuration);
    let rows = normaliseRows(props.value, config.columns);
    let lastSnapshot = JSON.stringify(rows);
    let fieldSnapshot = JSON.stringify({ id: props.id, isDisabled: props.isDisabled, isReadOnly: props.isReadOnly,
        isInvalid: props.isInvalid, ariaDescribedBy: props.ariaDescribedBy });
    let collapseFlags = rows.map(() => config.collapsed);
    let page = 0;
    let destroyed = false;
    let dragging = null;
    let removed = null;

    const root = element('div', 'fnx-r');
    const cards = element('div', 'fnx-r-items');
    const toolbar = element('div', 'fnx-r-toolbar');
    const footer = element('div', 'fnx-r-footer');
    const notice = element('p', 'fnx-r-notice');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    root.append(toolbar, cards, footer, notice);
    host.replaceChildren(root);

    const writable = () => !destroyed && !props.isDisabled && !props.isReadOnly;
    const notify = (message) => { notice.textContent = message; };
    const clampPage = () => { page = Math.max(0, Math.min(page, Math.max(0, Math.ceil(rows.length / config.pageSize) - 1))); };

    function commit() {
        if (!writable()) return;
        const payload = rows.map((row) => ({ ...row }));
        lastSnapshot = JSON.stringify(payload);
        props.onChange(payload); // Livewire state is deferred unless ->live() is used.
    }

    function add(index = rows.length, template = null) {
        if (!writable() || !config.addable || rows.length >= config.maxItems) {
            notify(config.labels.maxReached); return;
        }
        rows.splice(index, 0, template ? { ...template } : blankRow(config.columns));
        collapseFlags.splice(index, 0, config.collapsed);
        removed = null;
        page = Math.floor(index / config.pageSize);
        commit(); render();
    }

    function remove(index) {
        if (!writable() || !config.deletable || rows.length <= config.minItems) {
            notify(config.labels.minReached); return;
        }
        removed = { index, row: { ...rows[index] }, wasCollapsed: collapseFlags[index] };
        rows.splice(index, 1);
        collapseFlags.splice(index, 1);
        commit(); clampPage(); render();
    }

    function undo() {
        if (!writable() || !removed || rows.length >= config.maxItems) return;
        const { index, row, wasCollapsed } = removed;
        removed = null;
        rows.splice(index, 0, row);
        collapseFlags.splice(index, 0, wasCollapsed);
        page = Math.floor(index / config.pageSize);
        commit(); render();
    }

    function shift(from, to) {
        if (!writable() || !config.reorderable || from === to) return;
        rows = moveRow(rows, from, to);
        collapseFlags = moveRow(collapseFlags, from, to);
        page = Math.floor(to / config.pageSize);
        commit(); render();
    }

    function createInput(column, index) {
        const id = `${props.id || 'fnx-repeater'}-${index}-${column.name}`;
        const field = element('div', 'fnx-r-field');
        const caption = element('label', 'fnx-r-label', column.label);
        caption.htmlFor = id;
        if (column.required) {
            const required = element('span', 'fnx-r-required', ' *');
            required.setAttribute('aria-hidden', 'true');
            caption.append(required);
        }
        const value = rows[index][column.name];
        let input;

        if (column.type === 'textarea') {
            input = element('textarea', 'fnx-r-input fnx-r-textarea');
            input.rows = 3;
            input.value = value ?? '';
        } else if (column.type === 'select') {
            input = element('select', 'fnx-r-input');
            const empty = element('option', '', '—');
            empty.value = '';
            input.append(empty);
            for (const [optionValue, optionLabel] of Object.entries(column.options)) {
                const option = element('option', '', optionLabel);
                option.value = optionValue;
                input.append(option);
            }
            input.value = String(value ?? '');
        } else {
            input = element('input', column.type === 'checkbox' ? 'fnx-r-checkbox' : 'fnx-r-input');
            input.type = column.type === 'checkbox' ? 'checkbox' : column.type;
            if (column.type === 'checkbox') input.checked = Boolean(value);
            else input.value = value ?? '';
        }

        input.id = id;
        input.required = column.required;
        input.disabled = Boolean(props.isDisabled);
        if (column.type === 'number') {
            if (column.min !== null) input.min = String(column.min);
            if (column.max !== null) input.max = String(column.max);
            input.step = String(column.step ?? 'any');
        }
        if (column.maxLength !== null && 'maxLength' in input && column.type !== 'number') {
            input.maxLength = column.maxLength;
        }
        if (column.placeholder && 'placeholder' in input) input.placeholder = column.placeholder;
        if (props.isReadOnly || column.readOnly) {
            if (column.type === 'select' || column.type === 'checkbox') input.disabled = true;
            else input.readOnly = true;
        }
        if (props.isInvalid) input.setAttribute('aria-invalid', 'true');
        if (props.ariaDescribedBy) input.setAttribute('aria-describedby', props.ariaDescribedBy);

        input.addEventListener(column.type === 'select' || column.type === 'checkbox' ? 'change' : 'input', () => {
            if (!writable() || column.readOnly) return;
            let nextValue = input.value;
            if (column.type === 'checkbox') nextValue = input.checked;
            if (column.type === 'number') nextValue = input.value === '' ? null : input.valueAsNumber;
            rows[index][column.name] = nextValue;
            commit();
            // Do not replace the active input DOM node; preserves caret and focus.
        });
        input.addEventListener('blur', () => props.onBlur?.());
        if (column.type === 'checkbox') {
            const checkboxRow = element('div', 'fnx-r-checkbox-wrap');
            checkboxRow.append(input, caption);
            field.append(checkboxRow);
        } else {
            field.append(caption, input);
        }
        return field;
    }

    function createCard(index) {
        const card = element('section', 'fnx-r-item fi-fo-repeater-item');
        const header = element('div', 'fnx-r-item-header');
        const title = element('div', 'fnx-r-item-title');
        const labelValue = config.itemLabelColumn ? rows[index][config.itemLabelColumn] : null;
        title.append(element('span', 'fnx-r-title', labelValue || `${config.labels.item} ${index + 1}`));
        if (config.itemNumbers && labelValue) title.append(element('span', 'fnx-r-index', `#${index + 1}`));
        const actions = element('div', 'fnx-r-actions');

        if (config.reorderable && config.draggable && writable()) {
            const grip = iconButton(config.labels.drag, 'grip', () => {});
            grip.draggable = true;
            grip.classList.add('fnx-r-grip');
            grip.addEventListener('dragstart', (event) => {
                dragging = index;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
            });
            grip.addEventListener('dragend', () => { dragging = null; });
            actions.append(grip);
        }
        if (config.reorderable && config.moveButtons) {
            actions.append(
                iconButton(config.labels.moveUp, 'up', () => shift(index, index - 1), !writable() || index === 0),
                iconButton(config.labels.moveDown, 'down', () => shift(index, index + 1), !writable() || index >= rows.length - 1),
            );
        }
        if (config.duplicable) actions.append(iconButton(config.labels.duplicate, 'copy', () => add(index + 1, rows[index]), !writable() || rows.length >= config.maxItems));
        if (config.deletable) actions.append(iconButton(config.labels.delete, 'trash', () => remove(index), !writable() || rows.length <= config.minItems));
        if (config.collapsible) actions.append(iconButton(collapseFlags[index] ? config.labels.expand : config.labels.collapse,
            collapseFlags[index] ? 'down' : 'up', () => { collapseFlags[index] = !collapseFlags[index]; render(); }));
        header.append(title, actions);
        card.append(header);

        if (!collapseFlags[index]) {
            const body = element('div', 'fnx-r-item-body');
            const grid = element('div', 'fnx-r-grid');
            grid.style.setProperty('--fnx-grid-columns', String(config.gridColumns));
            for (const column of config.columns) grid.append(createInput(column, index));
            body.append(grid);
            card.append(body);
        }

        card.addEventListener('dragover', (event) => {
            if (dragging !== null && dragging !== index && writable()) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }
        });
        card.addEventListener('drop', (event) => {
            event.preventDefault();
            const from = dragging;
            dragging = null;
            if (from !== null && from !== index) shift(from, index);
        });
        return card;
    }

    function renderToolbar() {
        toolbar.replaceChildren();
        const info = element('div', 'fnx-r-count', `${rows.length.toLocaleString()} ${config.labels.items}`);
        toolbar.append(info);
        const tools = element('div', 'fnx-r-tools');
        if (removed && writable()) tools.append(iconButton(config.labels.undo, 'undo', undo));
        if (config.collapsible && rows.length) {
            tools.append(iconButton(config.labels.collapseAll, 'chevronsUp', () => {
                collapseFlags = rows.map(() => true); render();
            }));
            tools.append(iconButton(config.labels.expandAll, 'chevronsDown', () => {
                collapseFlags = rows.map(() => false); render();
            }));
        }
        toolbar.append(tools);
    }

    function renderCards() {
        cards.replaceChildren();
        if (rows.length === 0) {
            cards.append(element('div', 'fnx-r-empty', config.labels.empty));
            return;
        }
        const start = page * config.pageSize;
        const end = Math.min(rows.length, start + config.pageSize);
        for (let index = start; index < end; index++) cards.append(createCard(index));
    }

    function renderFooter() {
        footer.replaceChildren();
        const addArea = element('div', 'fnx-r-add-area');
        if (config.addable) addArea.append(actionButton(config.addLabel || config.labels.add, () => add(),
            !writable() || rows.length >= config.maxItems));
        footer.append(addArea);
        if (rows.length <= config.pageSize) return;
        const pagination = element('div', 'fnx-r-pagination');
        const start = page * config.pageSize + 1;
        const end = Math.min(rows.length, (page + 1) * config.pageSize);
        pagination.append(element('span', 'fnx-r-range', `${config.labels.showing} ${start}–${end} ${config.labels.of} ${rows.length}`));
        const controls = element('div', 'fnx-r-page-actions');
        controls.append(iconButton(config.labels.previous, 'left', () => { page--; render(); }, page === 0));
        controls.append(element('span', 'fnx-r-page-index', `${config.labels.page} ${page + 1} / ${Math.ceil(rows.length / config.pageSize)}`));
        controls.append(iconButton(config.labels.next, 'right', () => { page++; render(); }, page + 1 >= Math.ceil(rows.length / config.pageSize)));
        pagination.append(controls);
        footer.append(pagination);
    }

    function render() {
        if (destroyed) return;
        clampPage();
        root.id = props.id || '';
        root.setAttribute('role', 'group');
        root.setAttribute('aria-invalid', String(Boolean(props.isInvalid)));
        if (props.ariaDescribedBy) root.setAttribute('aria-describedby', props.ariaDescribedBy);
        else root.removeAttribute('aria-describedby');
        root.classList.toggle('fnx-r-invalid', Boolean(props.isInvalid));
        root.classList.toggle('fnx-r-readonly', Boolean(props.isDisabled || props.isReadOnly));
        renderToolbar(); renderCards(); renderFooter();
    }

    render();
    return {
        update(nextProps) {
            if (destroyed) return;
            const nextConfigSnapshot = JSON.stringify(nextProps.configuration || {});
            const nextFieldSnapshot = JSON.stringify({ id: nextProps.id, isDisabled: nextProps.isDisabled,
                isReadOnly: nextProps.isReadOnly, isInvalid: nextProps.isInvalid, ariaDescribedBy: nextProps.ariaDescribedBy });
            const changedConfig = nextConfigSnapshot !== configurationSnapshot;
            const changedField = nextFieldSnapshot !== fieldSnapshot;
            configurationSnapshot = nextConfigSnapshot;
            fieldSnapshot = nextFieldSnapshot;
            props = nextProps;
            if (changedConfig) config = normaliseConfiguration(nextProps.configuration);
            const incoming = normaliseRows(nextProps.value, config.columns);
            const snapshot = JSON.stringify(incoming);
            const changedValue = snapshot !== lastSnapshot;
            if (changedValue) {
                rows = incoming;
                lastSnapshot = snapshot;
                collapseFlags = rows.map(() => config.collapsed);
                removed = null;
            }
            if (changedConfig || changedValue || changedField) render();
        },
        destroy() {
            destroyed = true;
            dragging = null;
            removed = null;
            host.replaceChildren();
        },
    };
}
