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

export function createSidebar(roomCode, isHost, onLeave, onFinish, onManagement) {
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
