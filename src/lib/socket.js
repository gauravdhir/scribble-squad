/**
 * Socket.io client wrapper
 * Singleton to manage the connection.
 * Handles both browser (CDN) and Node (Mock) environments.
 */
import { toast } from '../features/ui/toast.js';
import { getFriendlyMessage } from '../utils/messages.js';

class SocketClient {
    constructor() {
        this.socket = null;
        this.connecting = null;
        this._mockStore = new Map(); // Store for unit tests
    }

    /**
     * Resets the mock state (useful for unit tests)
     */
    resetMock() {
        this._mockStore.clear();
        this.socket = null;
    }

    /**
     * Ensures we have a socket connection.
     * In a browser, it loads Socket.io from a CDN if not present.
     * In Node, it provides a mock for unit testing.
     */
    async connect() {
        // If we already have a socket and it's connected, we're good
        if (this.socket?.connected) return this.socket;

        // If we have a socket but it's disconnected, just show the UI and wait for it to reconnect
        if (this.socket) {
            // In Node/Test environment, skip UI logic
            if (typeof document === 'undefined') {
                if (!this.socket) {
                    this.socket = this._createMockSocket();
                }
                return this.socket;
            }

            const { connectionUI } = await import('../features/ui/connection-ui.js');
            if (!this.socket.connected) {
                connectionUI.show('SEARCHING FOR COMMAND... HANG TIGHT!');
            }
            return this.socket;
        }

        // In Node/Test environment, skip UI logic
        if (typeof document === 'undefined') {
            if (!this.socket) {
                this.socket = this._createMockSocket();
            }
            return this.socket;
        }

        if (this.connecting) return this.connecting;

        this.connecting = (async () => {
            try {
                const { connectionUI } = await import('../features/ui/connection-ui.js');

                // Browser Environment
                if (typeof io === 'undefined') {
                    const { io: socketIo } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
                    window.io = socketIo;
                }

                const serverUrl = window.location.origin;

                // Show "Hang tight" UI while we connect
                connectionUI.show('HANG TIGHT, CREW! WE ARE SETTING THINGS UP...');

                this.socket = window.io(serverUrl, {
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000
                });

                this.socket.on('connect', () => {
                    console.log('Connected to Scribble Squad Server');
                    connectionUI.hide();
                });

                this.socket.on('disconnect', (reason) => {
                    console.warn('Socket Disconnected:', reason);
                    if (reason === 'io server disconnect' || reason === 'transport close') {
                        connectionUI.show('LOST CONTACT! RE-ESTABLISHING CONNECTION...');
                    }
                });

                this.socket.on('connect_error', (err) => {
                    console.error('Socket Connection Error:', err);
                    connectionUI.show('STILL SEARCHING FOR COMMAND... HANG TIGHT!');
                });

            } catch (err) {
                console.error('Failed to initialize socket connection:', err);
                // Fallback to mock
                this.socket = this._createMockSocket();
            } finally {
                this.connecting = null;
            }
            return this.socket;
        })();

        return this.connecting;
    }

    /**
     * Emits an event, ensuring connection first.
     */
    async emit(event, ...args) {
        const socket = await this.connect();
        socket.emit(event, ...args);
    }

    /**
     * Subscribes to an event, ensuring connection first.
     */
    async on(event, callback) {
        const socket = await this.connect();
        socket.on(event, callback);
    }

    /**
     * Gets the raw socket instance if connected.
     * @returns {Object|null}
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Create a basic mock for Node.js test environment
     * @private
     */
    _createMockSocket() {
        return {
            on: () => { },
            off: () => { },
            emit: (event, ...args) => {
                const callback = args[args.length - 1];
                if (typeof callback === 'function') {
                    if (event === 'room:create') {
                        const room = args[0];
                        this._mockStore.set(room.code, room);
                        callback({ success: true, room });
                    } else if (event === 'room:update') {
                        const { code, updates } = args[0];
                        const room = this._mockStore.get(code) || {};
                        const updated = { ...room, ...updates };
                        this._mockStore.set(code, updated);
                        callback({ success: true, room: updated });
                    } else if (event === 'rooms:fetch') {
                        callback(Array.from(this._mockStore.values()));
                    } else if (event === 'room:join') {
                        // No-op for mock
                    } else {
                        callback({ success: true });
                    }
                }
            }
        };
    }
}

export const socketClient = new SocketClient();
