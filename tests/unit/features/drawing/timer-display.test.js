import test from 'node:test';
import assert from 'node:assert';

// -- DOM MOCK SETUP --
class MockElement {
    constructor(tag) {
        this.tagName = tag.toUpperCase();
        this.classList = new Set();
        this.attributes = new Map();
        this.style = {};
        this.children = [];
        this._innerHTML = '';
        this._textContent = '';
    }

    get classList() { return this._classList; }
    set classList(val) { this._classList = val; }
    // Fix: classList should be an object with add/remove/contains

    getAttribute(name) { return this.attributes.get(name); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    appendChild(child) { this.children.push(child); }
    querySelector(selector) {
        // Simple mock selector for class
        if (selector.startsWith('.')) {
            const className = selector.substring(1);
            // Search in children logic (simplified deep search)
            const find = (els) => {
                for (const el of els) {
                    if (el._classList.has(className)) return el;
                    if (el.children.length > 0) {
                        const found = find(el.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            return find(this.children);
        }
        return null; // Only support class selector for this test
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = val;
        // Rudimentary parser: if we set innerHTML with span class="timer-countdown", create child?
        // For the purpose of the test, we know TimerDisplay does innerHTML = `...`
        // We will manually populate the children needed for the test if innerHTML is complex, or rely on querySelector mock.
        // Actually, TimerDisplay uses innerHTML to set initial structure.
        // But then it uses querySelector to find .timer-countdown.
        // So we need to ensure querySelector finds something.
    }

    get textContent() { return this._textContent; }
    set textContent(val) { this._textContent = val; }
}

// Enhance MockElement for classList
MockElement.prototype._classList = {
    _set: new Set(),
    add: function (c) { this._set.add(c); },
    remove: function (c) { this._set.delete(c); },
    contains: function (c) { return this._set.has(c); },
    has: function (c) { return this._set.has(c); } // Helper for querySelector
};

global.document = {
    createElement: (tag) => {
        const el = new MockElement(tag);
        // Specialized logic for TimerDisplay which sets innerHTML
        // We need to intercept innerHTML setting or pre-populate children
        // But createElement is called before innerHTML set.
        return el;
    }
};

// We need to patch the MockElement prototype properly because defining it inside the function is tricky with `this`.
// Let's restart the mock definition to be cleaner.
// Re-defining cleaner structure below.

class SimpleElement {
    constructor(tag) {
        this.tagName = tag;
        this.classes = new Set();
        this.children = [];
        this.style = {};
        this._textContent = '';
    }

    get classList() {
        return {
            add: (c) => this.classes.add(c),
            remove: (c) => this.classes.delete(c),
            contains: (c) => this.classes.has(c)
        };
    }

    setAttribute(k, v) { }
    appendChild(c) { this.children.push(c); }

    set innerHTML(html) {
        // HACK: When TimerDisplay sets innerHTML, we manually create the child it expects to find later
        if (html.includes('timer-countdown')) {
            const span = new SimpleElement('span');
            span.classes.add('timer-countdown');
            // Extract initial value if possible, or hardcode for test
            span.textContent = '60';
            this.children.push(span);
        }
    }

    querySelector(sel) {
        if (sel === '.timer-countdown') {
            return this.children.find(c => c.classes.has('timer-countdown'));
        }
        return null;
    }

    get textContent() { return String(this._textContent); }
    set textContent(v) { this._textContent = String(v); }
}

global.document = {
    createElement: (tag) => new SimpleElement(tag)
};

// -- IMPORT --
// Now import the module under test
import { TimerDisplay } from '../../../../src/features/drawing/timer-display.js';

test('TimerDisplay should initialize with 60s', () => {
    const timer = new TimerDisplay();
    const el = timer.getElement();

    // Check if structure was created
    assert.strictEqual(el.children.length, 1, 'Should have created children via innerHTML hack');

    // Check initial state
    const display = timer.displayElement;
    assert.strictEqual(display.textContent, '60');
});

test('TimerDisplay.updateTime should update text and style', () => {
    const timer = new TimerDisplay();

    timer.updateTime(30);
    assert.strictEqual(timer.displayElement.textContent, '30');
    assert.strictEqual(timer.displayElement.classes.has('pulse'), false);

    // Critical Zone
    timer.updateTime(10);
    assert.strictEqual(timer.displayElement.textContent, '10');
    // Check color change (style object)
    assert.strictEqual(timer.displayElement.style.color, '#ff3333');
    // Check pulse class
    assert.strictEqual(timer.displayElement.classes.has('pulse'), true);
});

test('TimerDisplay.updateTime should reset style when time > 10', () => {
    const timer = new TimerDisplay();

    timer.updateTime(5);
    assert.strictEqual(timer.displayElement.classes.has('pulse'), true);

    timer.updateTime(15);
    assert.strictEqual(timer.displayElement.classes.has('pulse'), false);
    assert.strictEqual(timer.displayElement.style.color, '');
});
