/**
 * Palette UI - Color and Tool selection for the Chaos Canvas.
 */
import { createElement } from '../../lib/dom.js';

const COLORS = [
    '#ff4444', '#ff8844', '#ffcc00', '#ffff44', '#44ff44',
    '#44ffff', '#4488ff', '#8844ff', '#ff44ff', '#333333'
];

/**
 * Creates the palette component.
 * @param {Object} callbacks - { onSelectColor, onSelectEraser, onBrushSize, onEraserSize }
 */
export function createPaletteUI({ onSelectColor, onSelectEraser, onBrushSize, onEraserSize }) {
    const container = createElement('div', { classes: ['palette-wrapper'] });
    const toolsRow = createElement('div', { classes: ['palette-row'] });

    const clearSliders = () => {
        container.querySelectorAll('.tool-slider-popup').forEach(p => p.classList.remove('visible'));
    };

    /**
     * Helper to wrap a tool button with a hidden slider.
     */
    const createToolWithSlider = (toolBtn, onSizeChange, initialSize, min, max) => {
        const wrapper = createElement('div', { classes: ['tool-item-wrapper'] });
        const sliderPopup = createElement('div', { classes: ['tool-slider-popup'] });

        const slider = createElement('input', {
            classes: ['size-slider-vertical'],
            attr: { type: 'range', min, max, value: initialSize }
        });

        // Handle input change
        slider.oninput = (e) => {
            onSizeChange(parseInt(e.target.value));
        };

        sliderPopup.appendChild(slider);
        wrapper.appendChild(sliderPopup);
        wrapper.appendChild(toolBtn);

        // Double-click to toggle slider
        toolBtn.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const wasVisible = sliderPopup.classList.contains('visible');
            clearSliders();
            if (!wasVisible) {
                sliderPopup.classList.add('visible');
            }
        });

        // Close sliders on outside click
        document.addEventListener('mousedown', (e) => {
            if (!wrapper.contains(e.target)) {
                sliderPopup.classList.remove('visible');
            }
        });

        return wrapper;
    };

    // 1. Color Tools
    COLORS.forEach(color => {
        const btn = createElement('button', {
            classes: ['btn-color'],
            attr: { style: `background-color: ${color};`, 'data-color': color }
        });

        btn.onclick = () => {
            clearSliders();
            toolsRow.querySelectorAll('.btn-color, .btn-eraser').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onSelectColor(color);
        };

        const wrapped = createToolWithSlider(btn, onBrushSize, 5, 1, 50);
        toolsRow.appendChild(wrapped);
    });

    // 2. Eraser Tool (at the end)
    const eraserBtn = createElement('button', { classes: ['btn-eraser'] });
    eraserBtn.innerHTML = '🧹';
    eraserBtn.onclick = () => {
        clearSliders();
        toolsRow.querySelectorAll('.btn-color, .btn-eraser').forEach(b => b.classList.remove('active'));
        eraserBtn.classList.add('active');
        onSelectEraser();
    };

    const wrappedEraser = createToolWithSlider(eraserBtn, onEraserSize, 30, 5, 100);
    toolsRow.appendChild(wrappedEraser);

    container.appendChild(toolsRow);

    // Initial Active state
    setTimeout(() => {
        const first = toolsRow.querySelector('.btn-color');
        if (first) first.classList.add('active');
    }, 0);

    return container;
}
