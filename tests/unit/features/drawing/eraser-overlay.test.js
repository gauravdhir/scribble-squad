import test from 'node:test';
import assert from 'node:assert';

// -- DOM MOCK SETUP --
// Replicated logic, simplified for EraserOverlay needs
class MockElement {
    constructor(tag) {
        this.tagName = tag;
        this.style = {};
        this.children = [];
    }
    appendChild(child) { this.children.push(child); }
    getBoundingClientRect() { return { width: 1000, height: 1000, left: 0, top: 0 }; }

    // Stub for classList if needed by createElement utility
    get classList() {
        return { add: () => { }, remove: () => { } };
    }
    setAttribute(k, v) { }
}

global.document = {
    createElement: (tag) => new MockElement(tag)
};

import { EraserOverlay } from '../../../../src/features/drawing/eraser-overlay.js';

test('EraserOverlay should be hidden initially', () => {
    const container = new MockElement('div');
    const overlay = new EraserOverlay(container);

    assert.strictEqual(container.children.length, 1);
    const element = container.children[0];

    assert.strictEqual(overlay.isVisible, false);
    assert.strictEqual(element.style.display, 'none');
});

test('EraserOverlay.show should make it visible', () => {
    const container = new MockElement('div');
    const overlay = new EraserOverlay(container);

    overlay.show();
    const element = container.children[0];
    assert.strictEqual(element.style.display, 'block');
    assert.strictEqual(overlay.isVisible, true);
});

test('EraserOverlay.setSize should update dimensions based on container width', () => {
    const container = new MockElement('div');
    // Mock rect returns width=1000
    // Logic: (size / 2000) * width
    // Size 30 -> (30 / 2000) * 1000 = 15px

    const overlay = new EraserOverlay(container);
    overlay.show(); // Verify size update happens (updateDimensions called)
    overlay.setSize(30);

    const element = container.children[0];
    assert.strictEqual(element.style.width, '15px');
    assert.strictEqual(element.style.height, '15px');

    // Test larger size
    overlay.setSize(100); // 100/2000 * 1000 = 50
    assert.strictEqual(element.style.width, '50px');
});

test('EraserOverlay.updatePosition should update left/top styles', () => {
    const container = new MockElement('div');
    const overlay = new EraserOverlay(container);
    overlay.show();

    overlay.updatePosition(100, 200);
    const element = container.children[0];

    assert.strictEqual(element.style.left, '100px');
    assert.strictEqual(element.style.top, '200px');
});

test('EraserOverlay.hide should set display none', () => {
    const container = new MockElement('div');
    const overlay = new EraserOverlay(container);
    overlay.show();
    overlay.hide();

    const element = container.children[0];
    assert.strictEqual(element.style.display, 'none');
});
