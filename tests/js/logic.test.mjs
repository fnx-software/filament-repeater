import assert from 'node:assert/strict';
import test from 'node:test';
import { blankRow, moveRow, normaliseConfiguration, normaliseRows } from '../../dist/fnx-repeater.js';

const columns = [
    { name: 'product', label: 'Product', type: 'text', default: '' },
    { name: 'quantity', label: 'Quantity', type: 'number', default: 1 },
    { name: 'paid', label: 'Paid', type: 'checkbox', default: false },
];

test('empty input becomes empty list', () => {
    assert.deepEqual(normaliseRows(null, columns), []);
});

test('blank item uses field defaults', () => {
    assert.deepEqual(blankRow(columns), { product: '', quantity: 1, paid: false });
});

test('typed hydration ignores unknown keys', () => {
    assert.deepEqual(normaliseRows([{ product: 12, quantity: '4', paid: '1', admin: true }], columns), [
        { product: '12', quantity: 4, paid: true },
    ]);
});

test('reordering never mutates the original list', () => {
    const input = [1, 2, 3];
    assert.deepEqual(moveRow(input, 0, 2), [2, 3, 1]);
    assert.deepEqual(input, [1, 2, 3]);
});

test('configuration clamps page size and supports collapse', () => {
    const config = normaliseConfiguration({ columns, pageSize: 999, maxItems: 1200, collapsed: true });
    assert.equal(config.pageSize, 100);
    assert.equal(config.maxItems, 1200);
    assert.equal(config.collapsed, true);
    assert.equal(config.columns.length, 3);
});
