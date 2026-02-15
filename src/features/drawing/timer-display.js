import { createElement } from '../../lib/dom.js';

export class TimerDisplay {
    constructor() {
        this.container = createElement('div', { classes: ['timer-box'] });
        this.container.innerHTML = `
          <span class="timer-label">TIME LEFT:</span>
          <span class="timer-countdown">60</span>
        `;
        this.displayElement = this.container.querySelector('.timer-countdown');
        this.valueElement = this.displayElement; // Reference for direct updates
        this.lastTime = 60;
    }

    getElement() {
        return this.container;
    }

    updateTime(timeLeft) {
        if (timeLeft === this.lastTime) return;
        this.lastTime = timeLeft;

        this.displayElement.textContent = timeLeft;

        if (timeLeft <= 10) {
            this.displayElement.style.color = '#ff3333';
            if (!this.displayElement.classList.contains('pulse')) {
                this.displayElement.classList.add('pulse');
            }
        } else {
            this.displayElement.style.color = ''; // Reset
            this.displayElement.classList.remove('pulse');
        }
    }

    // Optional: Add specialized animation trigger
    animateHurry() {
        // Could add more intense shake or scale effect here
        this.displayElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.displayElement.style.transform = 'scale(1)';
        }, 200);
    }
}
