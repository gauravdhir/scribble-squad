/**
 * Judging Renderer - Responsible for the celebratory results view.
 * Strictly follows the premium "Judging Room" mock.
 */
import { createElement } from '../../lib/dom.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';

export function spawnFloatingReaction(type, x, y) {
    const el = createElement('div', { classes: ['floating-reaction'], text: type });
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Random horizontal drift
    const drift = (Math.random() - 0.5) * 100;
    el.style.setProperty('--drift', `${drift}px`);

    document.body.appendChild(el);

    // Cleanup after animation
    el.onanimationend = () => el.remove();
}

function createSidebar(roomCode, isHost, onLeave, onFinish, onManagement) {
    const sidebar = createElement('div', { classes: ['canvas-sidebar'] });
    sidebar.style.position = 'absolute';
    sidebar.style.left = '200px';
    sidebar.style.top = '35%';
    sidebar.style.transform = 'translateY(-50%)';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.gap = '15px';
    sidebar.style.zIndex = '1000'; // High z-index to be above reaction layer

    // CONTAINER STYLING
    sidebar.style.padding = '12px';
    sidebar.style.borderRadius = '30px';
    sidebar.style.background = 'rgba(20, 20, 35, 0.6)';
    sidebar.style.backdropFilter = 'blur(8px)';
    sidebar.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    sidebar.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(100, 200, 255, 0.1)';

    if (isHost) {
        // Host: Finish Mission
        const finishBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-finish'],
            attr: { title: 'End Mission' }
        });
        finishBtn.innerHTML = '🏁';
        Object.assign(finishBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        finishBtn.onclick = onFinish;

        finishBtn.onmouseenter = () => finishBtn.style.transform = 'scale(1.1)';
        finishBtn.onmouseleave = () => finishBtn.style.transform = 'scale(1)';

        const lobbyBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-mgmt'],
            attr: { title: 'Squad Management' }
        });
        lobbyBtn.innerHTML = '👥';
        Object.assign(lobbyBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(0, 0, 0, 0.6)', color: '#fff',
            fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        lobbyBtn.onmouseenter = () => lobbyBtn.style.transform = 'scale(1.1)';
        lobbyBtn.onmouseleave = () => lobbyBtn.style.transform = 'scale(1)';

        lobbyBtn.onclick = (e) => {
            console.log('👥 [JudgingRenderer] Squad Management Button Clicked');
            e.stopPropagation();
            if (onManagement) onManagement();
        };

        sidebar.appendChild(finishBtn);
        sidebar.appendChild(lobbyBtn);
    } else {
        // Guest: Leave
        const leaveBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-leave'],
            attr: { title: 'Leave Mission' }
        });
        leaveBtn.innerHTML = '🚪';
        Object.assign(leaveBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 68, 68, 0.3)',
            color: '#fff',
            fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        leaveBtn.onmouseenter = () => {
            leaveBtn.style.transform = 'scale(1.1)';
            leaveBtn.style.background = 'rgba(255, 68, 68, 0.8)';
        };
        leaveBtn.onmouseleave = () => {
            leaveBtn.style.transform = 'scale(1)';
            leaveBtn.style.background = 'rgba(255, 68, 68, 0.3)';
        };

        leaveBtn.onclick = () => {
            showConfirmationModal(
                'Are you sure you want to leave the judging ceremony?',
                onLeave
            );
        };
        sidebar.appendChild(leaveBtn);
    }

    return sidebar;
}

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
