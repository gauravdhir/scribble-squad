import { createElement } from '../../lib/dom.js';
import { spawnFloatingReaction, createSidebar } from './judging-components.js';

export function createJudgingUI(masterpieceImg, state, isJudge, judgeName, onAward, onReact, isHost, onFinish, roomCode, onLeave, onManagement) {
    const container = createElement('div', { classes: ['judging-wrapper'] });
    container.style.position = 'relative';

    // Sidebar
    // Note: If onLeave is missing (host?), we might still want finish button?
    // isHost determines if we show Finish. onLeave determines guest leaving?
    // We can assume isHost means Host, else Guest. But Host might want to Leave?
    // Usually Host aborts or finishes. Let's use isHost logic inside createSidebar.
    const sidebar = createSidebar(roomCode, isHost, onLeave, onFinish, onManagement);
    container.appendChild(sidebar);

    // 1. Header
    const titleBox = createElement('div', { classes: ['judging-title-box'] });
    // Use fallback if name missing
    const displayName = judgeName || 'The Judge';
    const judgeText = isJudge ? 'YOU are the Judge!' : `Judge: ${displayName}`;

    titleBox.innerHTML = `
    <h1 class="judging-app-title">Scribble Squad</h1>
    <div class="judging-subtitle-row">
        <div class="judge-info-pill">
            <span class="judge-avatar-icon">⚖️</span>
            <h2 class="judging-room-title">${judgeText}</h2>
        </div>
        
        <div class="judging-timer-container">
            <span class="timer-icon">⏳</span>
            <span class="judging-timer-value">60</span>s
        </div>

        <div class="canvas-code-display judging-code">
            <span class="code-label">SQUAD CODE:</span>
            <span class="code-value">${roomCode}</span>
        </div>
    </div>
  `;
    // Removed finishMissionBtn from header
    container.appendChild(titleBox);

    // 2. Main Masterpiece Display
    const frame = createElement('div', { classes: ['masterpiece-frame'] });
    const imgContent = createElement('div', { classes: ['masterpiece-content'] });
    imgContent.innerHTML = `<img src="${masterpieceImg}" alt="Masterpiece">`;

    frame.appendChild(imgContent);
    container.appendChild(frame);

    // 3. Reaction Layer
    const reactionLayer = createElement('div', { classes: ['reaction-layer'] });
    reactionLayer.onclick = (e) => {
        // Prevent click if hitting sidebar
        if (e.target.closest('.canvas-sidebar')) return;

        const rect = reactionLayer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;

        const emotes = isJudge ? ['⚖️', '🤔', '👀'] : ['❤️', '👍', '🌟', '🔥', '🚀'];
        const type = emotes[Math.floor(Math.random() * emotes.length)];

        onReact(type, x, y);
        spawnFloatingReaction(type, e.clientX, e.clientY);
    };
    container.appendChild(reactionLayer);

    // 4. Judging Medals Bar (Judge Only)
    if (isJudge) {
        const medalBar = createElement('div', { classes: ['medal-bar'] });
        let hasAwarded = false;

        ['gold', 'silver', 'bronze'].forEach(type => {
            const btn = createElement('button', { classes: ['btn-medal', `medal-${type}`] });
            btn.innerHTML = `
                <div class="medal-icon">🏆</div>
                <span class="medal-label">${type.toUpperCase()}</span>
            `;
            btn.onclick = (e) => {
                if (hasAwarded) return;
                hasAwarded = true;
                e.stopPropagation();

                // Disable all medals in UI
                medalBar.querySelectorAll('.btn-medal').forEach(b => {
                    b.classList.add('disabled');
                    b.style.pointerEvents = 'none';
                    b.style.opacity = '0.3';
                    b.style.filter = 'grayscale(1)';
                });

                onAward(type);
                btn.classList.add('celebrate');
                btn.style.opacity = '1';
                btn.style.filter = 'none';

                setTimeout(() => btn.classList.remove('celebrate'), 500);
            };
            medalBar.appendChild(btn);
        });

        container.appendChild(medalBar);
    } else {
        const waitMessage = createElement('span', {
            classes: ['judge-wait-msg'],
            text: `${displayName} is deliberating...`
        });
        container.appendChild(waitMessage);
    }

    return container;
}
