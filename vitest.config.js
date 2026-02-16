import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        alias: {
            '@': path.resolve(__dirname, './src')
        },
        include: ['tests/unit/**/*.test.mjs', 'tests/unit/**/*.test.js'],
        setupFiles: ['./tests/setup.js'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
