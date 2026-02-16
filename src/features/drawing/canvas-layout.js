import { createElement } from '../../lib/dom.js';
import { THEMES } from '../theme/theme-state.js';

export function createHeader(roomCode, prompt, providerName, timerDisplayElement) {
    const header = createElement('div', { classes: ['canvas-header'] });
    const infoGroup = createElement('div', { classes: ['canvas-info-group'] });

    const codeIndicator = createElement('div', { classes: ['canvas-code-display'] });
    codeIndicator.innerHTML = `<span class="code-label">SQUAD CODE:</span><span class="code-value">${roomCode}</span>`;

    const promptBox = createElement('div', { classes: ['prompt-box'] });
    promptBox.innerHTML = `<span class="prompt-label">PROMPT:</span><h2 class="prompt-text">${prompt.toUpperCase()}</h2><div class="prompt-provider">MISSION LEADER: <span class="provider-name">${providerName}</span></div>`;

    infoGroup.appendChild(codeIndicator);
    infoGroup.appendChild(timerDisplayElement);
    header.appendChild(promptBox);
    header.appendChild(infoGroup);
    return header;
}

export function createSidebar(isHost, isProvider, callbacks) {
    const { onFinish, onManagement, onLeave, onThemeSelect } = callbacks;
    const sidebar = createElement('div', { classes: ['canvas-sidebar'] });

    if (isHost) {
        // Host: Finish & Management
        const finishBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-finish'],
            attr: { title: 'Finish Mission Now' }
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
        lobbyBtn.style.position = 'relative';
        Object.assign(lobbyBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(0, 0, 0, 0.6)', color: '#fff',
            fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        lobbyBtn.onclick = onManagement;
        lobbyBtn.onmouseenter = () => lobbyBtn.style.transform = 'scale(1.1)';
        lobbyBtn.onmouseleave = () => lobbyBtn.style.transform = 'scale(1)';

        const badge = createElement('div', { classes: ['notification-badge'] });
        badge.style.display = 'none';
        badge.style.position = 'absolute';
        badge.style.top = '-2px';
        badge.style.right = '-2px';
        badge.style.background = '#ff4444';
        badge.style.color = 'white';
        badge.style.borderRadius = '50%';
        badge.style.padding = '2px 6px';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = 'bold';
        badge.style.pointerEvents = 'none';
        badge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
        lobbyBtn.appendChild(badge);

        sidebar.appendChild(finishBtn);
        sidebar.appendChild(lobbyBtn);
        sidebar.badgeElement = badge;

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
        leaveBtn.onclick = onLeave;
        leaveBtn.onmouseenter = () => leaveBtn.style.transform = 'scale(1.1)';
        leaveBtn.onmouseleave = () => leaveBtn.style.transform = 'scale(1)';
        sidebar.appendChild(leaveBtn);
    }

    if (isProvider) {
        const themeBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-theme'],
            attr: { title: 'Select Mission Atmosphere' }
        });
        themeBtn.innerHTML = '🎨';
        Object.assign(themeBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid var(--neon-blue)',
            background: 'rgba(0, 242, 255, 0.2)',
            color: '#fff', fontSize: '1.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 'auto', position: 'relative'
        });

        const themeMenu = createElement('div', { classes: ['theme-selection-menu'] });
        Object.assign(themeMenu.style, {
            position: 'absolute', left: '60px', bottom: '0',
            background: 'rgba(10, 14, 39, 0.95)', border: '1px solid var(--neon-blue)',
            borderRadius: '15px', padding: '10px', display: 'none',
            flexDirection: 'column', gap: '8px', zIndex: '200',
            width: '140px', boxShadow: '0 0 20px rgba(0, 242, 255, 0.3)'
        });

        const themeChoices = [
            { id: THEMES.SPACE, name: 'Default Space', icon: '🌌' },
            { id: THEMES.FESTIVE, name: 'Festive Party', icon: '🎉' },
            { id: THEMES.NEON, name: 'Cyber Neon', icon: '🌆' },
            { id: THEMES.OCEAN, name: 'Deep Sea', icon: '🌊' },
            { id: THEMES.LAVA, name: 'Molten Lava', icon: '🔥' }
        ];

        themeChoices.forEach(choice => {
            const btn = createElement('button', { classes: ['theme-choice-btn'] });
            btn.innerHTML = `${choice.icon} ${choice.name}`;
            Object.assign(btn.style, {
                background: 'transparent', border: 'none', color: 'white',
                padding: '8px', textAlign: 'left', cursor: 'pointer',
                borderRadius: '8px', fontSize: '0.9rem', width: '100%',
                transition: 'background 0.2s'
            });
            btn.onmouseenter = () => btn.style.background = 'rgba(255, 255, 255, 0.1)';
            btn.onmouseleave = () => btn.style.background = 'transparent';
            btn.onclick = (e) => {
                e.stopPropagation();
                if (onThemeSelect) onThemeSelect(choice.id);
                themeMenu.style.display = 'none';
            };
            themeMenu.appendChild(btn);
        });

        themeBtn.onclick = (e) => {
            e.stopPropagation();
            const isVisible = themeMenu.style.display === 'flex';
            themeMenu.style.display = isVisible ? 'none' : 'flex';
        };

        document.addEventListener('click', () => themeMenu.style.display = 'none');
        themeBtn.appendChild(themeMenu);
        sidebar.appendChild(themeBtn);
    }

    return sidebar;
}

export function createCanvasWrapper() {
    const canvasWrapper = createElement('div', { classes: ['canvas-wrapper'] });
    const layersContainer = createElement('div', { classes: ['canvas-layers-container'] });
    canvasWrapper.appendChild(createElement('div', { classes: ['canvas-texture'] }));
    canvasWrapper.appendChild(layersContainer);
    return { canvasWrapper, layersContainer };
}

export function createGameContainer() {
    const container = createElement('div', { classes: ['game-view-wrapper'] });
    container.style.position = 'relative';
    return container;
}
