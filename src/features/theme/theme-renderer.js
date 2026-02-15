import { createElement } from '../../lib/dom.js';
import { themeState, THEMES } from './theme-state.js';
import { themeAudio } from './theme-audio.js';


export class ThemeRenderer {
    constructor(container) {
        this.container = container;
        this.projectionLayer = null;
        this.lightsContainer = null;
        this.init();
    }

    init() {
        // 1. Create Projection Layer (background color cast)
        this.projectionLayer = createElement('div', { classes: ['theme-projection-layer'] });

        // 2. Create Lights Container (foreground elements)
        this.lightsContainer = createElement('div', { classes: ['theme-lights-container'] });

        // Insert projection at the very bottom, lights at the top (but below UI)
        this.container.prepend(this.projectionLayer);
        this.container.appendChild(this.lightsContainer);

        // Subscribe to state changes and store unsubscribe function
        this.unsubscribe = themeState.subscribe(this.renderTheme.bind(this));
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        themeAudio.stop();
        this.projectionLayer.remove();
        this.lightsContainer.remove();
    }



    renderTheme(themeId) {
        // Clear previous theme artifacts
        this.lightsContainer.innerHTML = '';
        this.container.classList.remove('theme-active-festive', 'theme-active-space', 'theme-active-neon', 'theme-active-ocean', 'theme-active-lava');
        this.projectionLayer.className = 'theme-projection-layer'; // Reset classes

        // Apply new theme
        this.container.classList.add(`theme-active-${themeId}`);
        themeAudio.playTheme(themeId);


        if (themeId === THEMES.FESTIVE) {
            this.renderFestiveLights();
            this.projectionLayer.classList.add('projection-festive');
        } else if (themeId === THEMES.NEON) {
            this.renderNeonBeams();
            this.projectionLayer.classList.add('projection-neon');
        } else if (themeId === THEMES.OCEAN) {
            this.renderOceanBubbles();
            this.projectionLayer.classList.add('projection-ocean');
        } else if (themeId === THEMES.LAVA) {
            this.renderLavaParticles();
            this.projectionLayer.classList.add('projection-lava');
        }
    }

    renderFestiveLights() {
        const lightCount = 20;
        const colors = ['#ff0055', '#ffee00', '#00ffaa', '#00ccff', '#aa00ff'];

        // Create a string path (visualized by positioning)
        const stringLine = createElement('div', { classes: ['light-string-wire'] });
        this.lightsContainer.appendChild(stringLine);

        for (let i = 0; i < lightCount; i++) {
            const light = createElement('div', { classes: ['festive-light'] });
            const color = colors[i % colors.length];
            const delay = Math.random() * 2;
            const duration = 1.5 + Math.random();

            light.style.setProperty('--light-color', color);
            light.style.setProperty('--delay', `${delay}s`);
            light.style.setProperty('--duration', `${duration}s`);

            const xPct = (i / (lightCount - 1)) * 100;
            const yDrop = Math.sin((i / (lightCount - 1)) * Math.PI) * 40;

            light.style.left = `${xPct}%`;
            light.style.top = `${-10 + yDrop}px`;

            this.lightsContainer.appendChild(light);
        }
    }

    renderNeonBeams() {
        // Horizontal scan lines / beams
        for (let i = 0; i < 3; i++) {
            const beam = createElement('div', { classes: ['neon-beam'] });
            beam.style.setProperty('--delay', `${i * 2}s`);
            beam.style.top = `${20 + (i * 30)}%`;
            this.lightsContainer.appendChild(beam);
        }
    }

    renderOceanBubbles() {
        const bubbleCount = 15;
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = createElement('div', { classes: ['ocean-bubble'] });
            const size = 5 + Math.random() * 15;
            const left = Math.random() * 100;
            const duration = 3 + Math.random() * 5;
            const delay = Math.random() * 5;

            Object.assign(bubble.style, {
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: `-30px`,
                position: 'absolute'
            });
            bubble.style.setProperty('--duration', `${duration}s`);
            bubble.style.setProperty('--delay', `${delay}s`);

            this.lightsContainer.appendChild(bubble);
        }
    }


    renderLavaParticles() {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = createElement('div', { classes: ['lava-ember'] });
            const left = Math.random() * 100;
            const delay = Math.random() * 4;
            const duration = 2 + Math.random() * 3;

            particle.style.left = `${left}%`;
            particle.style.bottom = `-10px`;
            particle.style.setProperty('--delay', `${delay}s`);
            particle.style.setProperty('--duration', `${duration}s`);

            this.lightsContainer.appendChild(particle);
        }
    }
}
