/**
 * Confetti Manager
 * Provides a particle explosion effect for awards.
 */
import { createElement } from '../../lib/dom.js';

/**
 * Explodes confetti from a specific point or center screen.
 * @param {string} colorType - 'gold', 'silver', or 'bronze'
 */
export function fireConfetti(colorType = 'gold') {
    const colors = {
        gold: ['#FFD700', '#FFA500', '#FFFFFF'],
        silver: ['#C0C0C0', '#A9A9A9', '#FFFFFF'],
        bronze: ['#CD7F32', '#8B4513', '#FFFFFF']
    };

    const palette = colors[colorType] || colors.gold;
    const particleCount = 100;

    const layer = createElement('div', { classes: ['confetti-layer'] });
    document.body.appendChild(layer);

    // Initial burst calculation
    for (let i = 0; i < particleCount; i++) {
        createParticle(layer, palette);
    }

    // Cleanup layer after animation
    setTimeout(() => {
        layer.remove();
    }, 5000);
}

function createParticle(container, palette) {
    const p = createElement('div', { classes: ['confetti-particle'] });

    // Random visual properties
    const color = palette[Math.floor(Math.random() * palette.length)];
    const size = Math.random() * 8 + 4 + 'px';
    const shape = Math.random() > 0.5 ? '50%' : '0%'; // Circle or Square

    // Physics Init
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 15 + 10;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 10; // Initial upward burst bias

    p.style.backgroundColor = color;
    p.style.width = size;
    p.style.height = size;
    p.style.borderRadius = shape;
    p.style.position = 'absolute';
    p.style.left = '50vw';
    p.style.top = '50vh';
    p.style.opacity = '1';

    container.appendChild(p);

    // Animate
    let x = 0;
    let y = 0;
    let velX = vx;
    let velY = vy;
    const gravity = 0.5;
    const drag = 0.96;

    const animate = () => {
        velX *= drag;
        velY *= drag;
        velY += gravity;

        x += velX;
        y += velY;

        p.style.transform = `translate(${x}px, ${y}px) rotate(${x * 10}deg)`;

        // simple floor bounce or stick
        if (y > window.innerHeight * 0.5) {
            p.style.opacity -= 0.05;
        }

        if (p.style.opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            p.remove();
        }
    };

    requestAnimationFrame(animate);
}
