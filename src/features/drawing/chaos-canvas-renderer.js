import { createElement } from '../../lib/dom.js';
import { createPaletteUI } from './palette-ui.js';
import { RoomAPI } from '../lobby/room-api.js';
import { appState } from '../../main.js';
import { CanvasLayerManager } from './canvas-layer-manager.js';
import { TimerDisplay } from './timer-display.js';
import { EraserOverlay } from './eraser-overlay.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';
import { ThemeRenderer } from '../theme/theme-renderer.js';
import { themeState, THEMES } from '../theme/theme-state.js';
import { themeAudio } from '../theme/theme-audio.js';

function createHeader(roomCode, prompt, providerName, timerDisplay) {
    const header = createElement('div', { classes: ['canvas-header'] });

    // Note: Leave button removed from header as requested.

    const infoGroup = createElement('div', { classes: ['canvas-info-group'] });

    const codeIndicator = createElement('div', { classes: ['canvas-code-display'] });
    codeIndicator.innerHTML = `<span class="code-label">SQUAD CODE:</span><span class="code-value">${roomCode}</span>`;

    const promptBox = createElement('div', { classes: ['prompt-box'] });
    promptBox.innerHTML = `<span class="prompt-label">PROMPT:</span><h2 class="prompt-text">${prompt.toUpperCase()}</h2><div class="prompt-provider">MISSION LEADER: <span class="provider-name">${providerName}</span></div>`;

    infoGroup.appendChild(codeIndicator);
    infoGroup.appendChild(timerDisplay.getElement());
    header.appendChild(promptBox);
    header.appendChild(infoGroup);
    return header;
}

function createSidebar(roomCode, isHost, onLeave, updateBadgeCallback, providerName, onManagement) {
    const currentUserId = appState.profileState.displayName;
    // Robust comparison (ignore case and whitespace)
    const normalizedUser = currentUserId?.trim().toLowerCase();
    const normalizedProvider = providerName?.trim().toLowerCase();
    const isProvider = normalizedUser && normalizedProvider && normalizedUser === normalizedProvider;


    const sidebar = createElement('div', { classes: ['canvas-sidebar'] });
    // Styles moved to style.css for responsive control

    if (isHost) {
        // Host: Finish Mission & Squad Management
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

        finishBtn.onmouseenter = () => finishBtn.style.transform = 'scale(1.1)';
        finishBtn.onmouseleave = () => finishBtn.style.transform = 'scale(1)';

        finishBtn.onclick = () => {
            showConfirmationModal(
                'FINISH MISSION? This will end the drawing phase for everyone immediately.',
                () => RoomAPI.finishRoom(roomCode)
            );
        };

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
        lobbyBtn.onmouseenter = () => lobbyBtn.style.transform = 'scale(1.1)';
        lobbyBtn.onmouseleave = () => lobbyBtn.style.transform = 'scale(1)';

        lobbyBtn.onclick = (e) => {
            console.log('👥 [ChaosRenderer] Squad Management Button Clicked');
            e.stopPropagation();
            if (onManagement) {
                onManagement();
            } else {
                console.warn('⚠️ [ChaosRenderer] onManagement callback missing!');
                import('../party/room-controller.js').then(m => m.renderRoomLobby(roomCode || appState.currentRoomCode));
            }
        };

        // Badge
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

        if (updateBadgeCallback) updateBadgeCallback(badge);

        sidebar.appendChild(finishBtn);
        sidebar.appendChild(lobbyBtn);

    } else {
        // Guest: Leave Mission
        const leaveBtn = createElement('button', {
            classes: ['btn-icon-sidebar', 'btn-leave'],
            attr: { title: 'Leave Mission' }
        });
        leaveBtn.innerHTML = '🚪';
        Object.assign(leaveBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 68, 68, 0.3)', // Red tint
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
                'Are you sure you want to leave the mission? You will be returned to the Discovery Lobby.',
                onLeave
            );
        };
        sidebar.appendChild(leaveBtn);
    }

    // THEME SECTOR (Only for Mission Leader)
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

        // Theme Menu
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
                themeState.setTheme(choice.id, roomCode);
                themeMenu.style.display = 'none';
            };
            themeMenu.appendChild(btn);
        });

        themeBtn.onclick = (e) => {
            e.stopPropagation();
            const isVisible = themeMenu.style.display === 'flex';
            themeMenu.style.display = isVisible ? 'none' : 'flex';
        };

        // Close menu on outside click
        document.addEventListener('click', () => themeMenu.style.display = 'none');

        themeBtn.appendChild(themeMenu);
        sidebar.appendChild(themeBtn);
    }

    return sidebar;
}


export function createChaosCanvasUI(prompt, roomCode, isHost, onDrawEnd, providerName, onLeave, onManagement) {
    const container = createElement('div', { classes: ['game-view-wrapper'] });
    container.style.position = 'relative'; // Ensure absolute children are contained

    // 1. Components
    const timerDisplay = new TimerDisplay();
    container.timerDisplay = timerDisplay; // Expose for controller sync
    const eraserOverlay = new EraserOverlay(container);
    const canvasWrapper = createElement('div', { classes: ['canvas-wrapper'] });
    const layersContainer = createElement('div', { classes: ['canvas-layers-container'] });
    canvasWrapper.appendChild(createElement('div', { classes: ['canvas-texture'] }));
    canvasWrapper.appendChild(layersContainer);

    const layerManager = new CanvasLayerManager(layersContainer);

    // 2. Build DOM
    // Pass prompt, etc to header, but NOT onLeave (handled by sidebar)
    container.appendChild(createHeader(roomCode, prompt, providerName, timerDisplay));
    container.appendChild(canvasWrapper);

    // 3. Theme System
    const themeRenderer = new ThemeRenderer(container);

    // Ensure joined to room for sync
    if (roomCode) {
        console.log(`📡 Joining socket room for theme sync: ${roomCode}`);
        RoomAPI.joinRoom(roomCode);
    }


    let state = {
        color: '#ff4444',
        isEraser: false,
        brushSize: 5,
        eraserSize: 30,
        isDrawing: false,
        lastPoint: null
    };

    const palette = createPaletteUI({
        onSelectColor: (c) => { state.color = c; state.isEraser = false; },
        onSelectEraser: () => { state.isEraser = true; },
        onBrushSize: (s) => { state.brushSize = s; },
        onEraserSize: (s) => { state.eraserSize = s; eraserOverlay.setSize(s); }
    });
    container.appendChild(palette);

    // Sidebar Logic
    let updateBadgeFn = null;
    const sidebar = createSidebar(roomCode, isHost, onLeave, (badgeEl) => {
        updateBadgeFn = (count) => {
            if (count > 0) {
                badgeEl.textContent = count > 9 ? '9+' : count;
                badgeEl.style.display = 'flex';
                badgeEl.style.justifyContent = 'center';
                badgeEl.style.alignItems = 'center';
                badgeEl.style.minWidth = '20px';
            } else {
                badgeEl.style.display = 'none';
            }
        };
    }, providerName, onManagement);
    container.appendChild(sidebar);

    // Expose updatePendingCount
    container.updatePendingCount = (count) => {
        if (updateBadgeFn) updateBadgeFn(count);
    };

    // 3. Logic Initialization
    setTimeout(() => {
        const currentUserId = appState.profileState.displayName;
        const myEngine = layerManager.getEngine(currentUserId, currentUserId);
        const mainCanvas = myEngine.canvas;

        // SYNC: Incoming Strokes
        const handleIncoming = (stroke) => {
            const engine = layerManager.getEngine(stroke.userId, currentUserId);
            const rect = layerManager.getRect();
            engine.drawSegment(stroke.p1, stroke.p2, stroke.color, rect.width, rect.height, stroke.isEraser, stroke.size);
        };
        RoomAPI.subscribe('draw:incoming', handleIncoming);
        RoomAPI.syncStrokes(roomCode).then(strokes => strokes.forEach(handleIncoming));

        // SYNC: Timer
        const handleTimer = ({ timeLeft }) => timerDisplay.updateTime(timeLeft);
        RoomAPI.subscribe('timer:update', handleTimer);

        // SYNC: Game End
        const handleEnd = () => {
            const finalCanvas = document.createElement('canvas'); // Flatten
            const rect = layerManager.getRect();
            finalCanvas.width = rect.width;
            finalCanvas.height = rect.height;
            const ctx = finalCanvas.getContext('2d');
            layerManager.getAllCanvases().forEach(c => ctx.drawImage(c, 0, 0, rect.width, rect.height));
            const masterpiece = finalCanvas.toDataURL();
            RoomAPI.submitMasterpiece(roomCode, masterpiece);
            onDrawEnd(masterpiece);
        };
        RoomAPI.subscribe('timer:ended', handleEnd);

        // SYNC: Theme Changes
        const handleThemeChange = ({ themeId }) => themeState.applyRemoteTheme(themeId);
        RoomAPI.subscribe('room:theme-changed', handleThemeChange);

        // SYNC: Initial Theme
        RoomAPI.getRoom(roomCode).then(room => {
            if (room && room.currentTheme) {
                themeState.applyRemoteTheme(room.currentTheme);
            }
        });


        // INPUT: Drawing
        const handleDrawStart = (e) => {
            // Prevent drawing if interacting with sidebar or palette
            if (e.target.closest('.canvas-sidebar') || e.target.closest('.palette-ui')) return;

            state.isDrawing = true;
            const rect = layerManager.getRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            state.lastPoint = { x: ((clientX - rect.left) / rect.width) * 1000, y: ((clientY - rect.top) / rect.height) * 1000 };
        };

        const handleDrawMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // UI Overlay Update
            if (state.isEraser) {
                eraserOverlay.show();
                eraserOverlay.updatePosition(clientX, clientY);
            } else {
                eraserOverlay.hide();
            }

            if (!state.isDrawing) return;
            if (e.preventDefault) e.preventDefault(); // Stop scrolling on touch

            const rect = layerManager.getRect();
            const x = ((clientX - rect.left) / rect.width) * 1000;
            const y = ((clientY - rect.top) / rect.height) * 1000;
            const newPoint = { x, y };

            if (Math.hypot(x - state.lastPoint.x, y - state.lastPoint.y) > 2) {
                const size = state.isEraser ? state.eraserSize : state.brushSize;
                myEngine.drawSegment(state.lastPoint, newPoint, state.color, rect.width, rect.height, state.isEraser, size);
                RoomAPI.sendStroke(roomCode, { userId: currentUserId, p1: state.lastPoint, p2: newPoint, color: state.color, isEraser: state.isEraser, size });
                state.lastPoint = newPoint;
            }
        };

        const handleDrawEnd = () => state.isDrawing = false;

        mainCanvas.addEventListener('mousedown', handleDrawStart);
        window.addEventListener('mousemove', handleDrawMove);
        window.addEventListener('mouseup', handleDrawEnd);
        mainCanvas.addEventListener('touchstart', handleDrawStart, { passive: false });
        window.addEventListener('touchmove', handleDrawMove, { passive: false });
        window.addEventListener('touchend', handleDrawEnd);

        // CLEANUP
        const observer = new MutationObserver(() => {
            if (!document.contains(container)) {
                RoomAPI.unsubscribe('draw:incoming', handleIncoming);
                RoomAPI.unsubscribe('timer:update', handleTimer);
                RoomAPI.unsubscribe('timer:ended', handleEnd);
                RoomAPI.unsubscribe('room:theme-changed', handleThemeChange);
                themeRenderer.destroy();
                window.removeEventListener('mousemove', handleDrawMove);

                window.removeEventListener('mouseup', handleDrawEnd);
                window.removeEventListener('touchmove', handleDrawMove);
                window.removeEventListener('touchend', handleDrawEnd);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

    }, 0);

    return container;
}
