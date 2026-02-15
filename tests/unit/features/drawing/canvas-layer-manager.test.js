import test from 'node:test';
import assert from 'node:assert';

// -- CANVAS & DOM MOCK SETUP --
class MockContext2D {
    constructor() {
        this.lineWidth = 1;
        this.strokeStyle = '#000';
    }
    beginPath() { }
    moveTo() { }
    lineTo() { }
    stroke() { }
    clearRect() { }
}

class MockCanvas extends Object {
    constructor() {
        super();
        this.tagName = 'CANVAS';
        this.width = 0;
        this.height = 0;
        this.style = {};
        this.children = [];
        this._context = new MockContext2D();
        this._classes = new Set();
    }
    getContext(type) { return this._context; }
    setAttribute() { }
    get classList() {
        return {
            add: (c) => this._classes.add(c),
            remove: (c) => this._classes.delete(c),
            contains: (c) => this._classes.has(c)
        };
    }
    // Needed for CanvasLayerManager to append to container
}

class MockContainer {
    constructor() {
        this.children = [];
        this.innerHTML = '';
    }
    appendChild(child) { this.children.push(child); }
    getBoundingClientRect() { return { width: 1000, height: 1000, left: 0, top: 0 }; }
}

global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') return new MockCanvas();
        return new MockContainer(); // Default for container
    }
};

global.window = {
    devicePixelRatio: 2
};

import { CanvasLayerManager } from '../../../../src/features/drawing/canvas-layer-manager.js';

test('CanvasLayerManager should create new layer for new user', () => {
    const container = new MockContainer();
    const manager = new CanvasLayerManager(container);

    // getEngine(userId, currentUserId)
    const engine = manager.getEngine('user1', 'user1');

    assert.ok(engine, 'Should return an engine');
    assert.ok(manager.engines.has('user1'), 'Should store engine in map');
    assert.strictEqual(container.children.length, 1, 'Should append canvas to container');

    // Verify canvas properties
    const canvas = container.children[0];
    assert.strictEqual(canvas.width, 2000, 'CanvasEngine should set resolution to 2000');
    assert.strictEqual(canvas.style.pointerEvents, 'auto', 'Should allow pointer events for current user');
});

test('CanvasLayerManager should reuse existing layer', () => {
    const container = new MockContainer();
    const manager = new CanvasLayerManager(container);

    const engine1 = manager.getEngine('user1', 'user1');
    const engine2 = manager.getEngine('user1', 'user1');

    assert.strictEqual(engine1, engine2, 'Should return same engine instance');
    assert.strictEqual(container.children.length, 1, 'Should not create duplicate canvas');
});

test('CanvasLayerManager should disable pointer events for other users', () => {
    const container = new MockContainer();
    const manager = new CanvasLayerManager(container);

    manager.getEngine('otherUser', 'currentUser');

    const canvas = container.children[0];
    assert.strictEqual(canvas.style.pointerEvents, 'none', 'Should disable pointer events for others');
});

test('CanvasLayerManager.clear should remove all layers', () => {
    const container = new MockContainer();
    const manager = new CanvasLayerManager(container);

    manager.getEngine('user1', 'user1');
    manager.getEngine('user2', 'user1');

    assert.strictEqual(manager.engines.size, 2);
    assert.strictEqual(container.children.length, 2);

    manager.clear();

    assert.strictEqual(manager.engines.size, 0);
    assert.strictEqual(container.innerHTML, '', 'Should clear container HTML');
});
