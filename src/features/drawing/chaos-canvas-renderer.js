import { createPaletteUI } from './palette-ui.js';
import { RoomAPI } from '../lobby/room-api.js';
import { appState } from '../../main.js';
import { CanvasLayerManager } from './canvas-layer-manager.js';
import { TimerDisplay } from './timer-display.js';
import { EraserOverlay } from './eraser-overlay.js';
import { showConfirmationModal } from '../ui/confirmation-modal.js';
import { ThemeRenderer } from '../theme/theme-renderer.js';
import { themeState } from '../theme/theme-state.js';
import { createHeader, createSidebar, createCanvasWrapper, createGameContainer } from './canvas-layout.js';

export function createChaosCanvasUI(prompt, roomCode, isHost, onDrawEnd, providerName, onLeave, onManagement) {
    const container = createGameContainer();

    // Components
    const timerDisplay = new TimerDisplay();
    container.timerDisplay = timerDisplay;
    const eraserOverlay = new EraserOverlay(container);
    const { canvasWrapper, layersContainer } = createCanvasWrapper();
    const layerManager = new CanvasLayerManager(layersContainer);

    // Build Layout
    container.appendChild(createHeader(roomCode, prompt, providerName, timerDisplay.getElement()));
    container.appendChild(canvasWrapper);

    // Sidebar
    const currentUserId = appState.profileState.displayName;
    const normalizedUser = currentUserId?.trim().toLowerCase();
    const normalizedProvider = providerName?.trim().toLowerCase();
    const isProvider = normalizedUser && normalizedProvider && normalizedUser === normalizedProvider;

    let updateBadgeFn = null;
    const sidebar = createSidebar(isHost, isProvider, {
        onFinish: () => showConfirmationModal(
            'FINISH MISSION? This will end the drawing phase for everyone immediately.',
            () => RoomAPI.finishRoom(roomCode)
        ),
        onManagement: () => {
            console.log('👥 [ChaosRenderer] Squad Management Button Clicked');
            if (onManagement) onManagement();
            else import('../party/room-controller.js').then(m => m.renderRoomLobby(roomCode || appState.currentRoomCode));
        },
        onLeave: () => showConfirmationModal(
            'Are you sure you want to leave the mission? You will be returned to the Discovery Lobby.',
            onLeave
        ),
        onThemeSelect: (themeId) => themeState.setTheme(themeId, roomCode)
    });

    if (sidebar.badgeElement) {
        updateBadgeFn = (count) => {
            const badgeEl = sidebar.badgeElement;
            if (count > 0) {
                badgeEl.textContent = count > 9 ? '9+' : count;
                Object.assign(badgeEl.style, { display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '20px' });
            } else {
                badgeEl.style.display = 'none';
            }
        };
    }
    container.appendChild(sidebar);
    container.updatePendingCount = (count) => { if (updateBadgeFn) updateBadgeFn(count); };

    // Palette & State
    let state = { color: '#ff4444', isEraser: false, brushSize: 5, eraserSize: 30, isDrawing: false, lastPoint: null };
    const palette = createPaletteUI({
        onSelectColor: (c) => { state.color = c; state.isEraser = false; },
        onSelectEraser: () => { state.isEraser = true; },
        onBrushSize: (s) => { state.brushSize = s; },
        onEraserSize: (s) => { state.eraserSize = s; eraserOverlay.setSize(s); }
    });
    container.appendChild(palette);

    // Theme & Sync
    const themeRenderer = new ThemeRenderer(container);
    if (roomCode) {
        console.log(`📡 Joining socket room for theme sync: ${roomCode}`);
        RoomAPI.joinRoom(roomCode);
    }

    // Initialization
    setTimeout(() => {
        const myEngine = layerManager.getEngine(currentUserId, currentUserId);
        const mainCanvas = myEngine.canvas;

        const handleIncoming = (stroke) => {
            const engine = layerManager.getEngine(stroke.userId, currentUserId);
            const rect = layerManager.getRect();
            engine.drawSegment(stroke.p1, stroke.p2, stroke.color, rect.width, rect.height, stroke.isEraser, stroke.size);
        };
        const handleTimer = ({ timeLeft }) => timerDisplay.updateTime(timeLeft);
        const handleEnd = () => {
            const finalCanvas = document.createElement('canvas'); // Flatten
            const rect = layerManager.getRect();
            finalCanvas.width = rect.width; finalCanvas.height = rect.height;
            const ctx = finalCanvas.getContext('2d');
            layerManager.getAllCanvases().forEach(c => ctx.drawImage(c, 0, 0, rect.width, rect.height));
            const masterpiece = finalCanvas.toDataURL();
            RoomAPI.submitMasterpiece(roomCode, masterpiece);
            onDrawEnd(masterpiece);
        };
        const handleThemeChange = ({ themeId }) => themeState.applyRemoteTheme(themeId);

        // Subscriptions
        RoomAPI.subscribe('draw:incoming', handleIncoming);
        RoomAPI.subscribe('timer:update', handleTimer);
        RoomAPI.subscribe('timer:ended', handleEnd);
        RoomAPI.subscribe('room:theme-changed', handleThemeChange);
        RoomAPI.syncStrokes(roomCode).then(strokes => strokes.forEach(handleIncoming));
        RoomAPI.getRoom(roomCode).then(room => {
            if (room && room.currentTheme) themeState.applyRemoteTheme(room.currentTheme);
        });

        // Drawing Event Handlers
        const handleDrawStart = (e) => {
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
            if (state.isEraser) { eraserOverlay.show(); eraserOverlay.updatePosition(clientX, clientY); }
            else { eraserOverlay.hide(); }

            if (!state.isDrawing) return;
            if (e.preventDefault) e.preventDefault();

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

        // Cleanup
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
