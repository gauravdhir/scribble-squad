/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JudgingState } from '../../../src/features/judging/judging-state.js';

describe('JudgingState', () => {
    let judgingState;

    beforeEach(() => {
        judgingState = new JudgingState();
    });

    it('should initialize with zero medals', () => {
        expect(judgingState.medals).toEqual({
            gold: 0,
            silver: 0,
            bronze: 0
        });
    });

    it('should initialize with empty reactions array', () => {
        expect(judgingState.reactions).toEqual([]);
        expect(judgingState.reactions.length).toBe(0);
    });

    it('should award gold medal correctly', () => {
        judgingState.awardMedal('gold');

        expect(judgingState.medals.gold).toBe(1);
        expect(judgingState.medals.silver).toBe(0);
        expect(judgingState.medals.bronze).toBe(0);
    });

    it('should award silver medal correctly', () => {
        judgingState.awardMedal('silver');

        expect(judgingState.medals.gold).toBe(0);
        expect(judgingState.medals.silver).toBe(1);
        expect(judgingState.medals.bronze).toBe(0);
    });

    it('should award bronze medal correctly', () => {
        judgingState.awardMedal('bronze');

        expect(judgingState.medals.gold).toBe(0);
        expect(judgingState.medals.silver).toBe(0);
        expect(judgingState.medals.bronze).toBe(1);
    });

    it('should increment medals correctly with multiple awards', () => {
        judgingState.awardMedal('gold');
        judgingState.awardMedal('gold');
        judgingState.awardMedal('silver');
        judgingState.awardMedal('bronze');
        judgingState.awardMedal('gold');

        expect(judgingState.medals.gold).toBe(3);
        expect(judgingState.medals.silver).toBe(1);
        expect(judgingState.medals.bronze).toBe(1);
    });

    it('should handle invalid medal type gracefully', () => {
        judgingState.awardMedal('platinum');

        expect(judgingState.medals.gold).toBe(0);
        expect(judgingState.medals.silver).toBe(0);
        expect(judgingState.medals.bronze).toBe(0);
    });

    it('should add reaction with all properties', () => {
        judgingState.addReaction('👍', 500, 300);

        expect(judgingState.reactions.length).toBe(1);
        expect(judgingState.reactions[0].type).toBe('👍');
        expect(judgingState.reactions[0].x).toBe(500);
        expect(judgingState.reactions[0].y).toBe(300);
        expect(judgingState.reactions[0].id).toBeDefined();
    });

    it('should generate unique IDs for each reaction', () => {
        judgingState.addReaction('😂', 100, 200);
        judgingState.addReaction('❤️', 300, 400);
        judgingState.addReaction('🎉', 500, 600);

        const ids = judgingState.reactions.map(r => r.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(3);
        expect(judgingState.reactions.length).toBe(3);
    });

    it('should add multiple reactions sequentially', () => {
        judgingState.addReaction('🔥', 100, 100);
        judgingState.addReaction('💯', 200, 200);
        judgingState.addReaction('✨', 300, 300);

        expect(judgingState.reactions.length).toBe(3);
        expect(judgingState.reactions[0].type).toBe('🔥');
        expect(judgingState.reactions[1].type).toBe('💯');
        expect(judgingState.reactions[2].type).toBe('✨');
    });

    it('should preserve reaction coordinates correctly', () => {
        judgingState.addReaction('⭐', 999, 1);

        expect(judgingState.reactions[0].x).toBe(999);
        expect(judgingState.reactions[0].y).toBe(1);
    });

    it('should handle reactions at boundaries', () => {
        judgingState.addReaction('📌', 0, 0);
        judgingState.addReaction('📍', 1000, 1000);

        expect(judgingState.reactions[0].x).toBe(0);
        expect(judgingState.reactions[0].y).toBe(0);
        expect(judgingState.reactions[1].x).toBe(1000);
        expect(judgingState.reactions[1].y).toBe(1000);
    });

    it('should clear all medals and reactions', () => {
        judgingState.awardMedal('gold');
        judgingState.awardMedal('silver');
        judgingState.awardMedal('bronze');
        judgingState.addReaction('🎯', 500, 500);
        judgingState.addReaction('🚀', 600, 600);

        judgingState.clear();

        expect(judgingState.medals).toEqual({
            gold: 0,
            silver: 0,
            bronze: 0
        });
        expect(judgingState.reactions).toEqual([]);
    });

    it('should allow awarding medals after clear', () => {
        judgingState.awardMedal('gold');
        judgingState.clear();
        judgingState.awardMedal('silver');

        expect(judgingState.medals.gold).toBe(0);
        expect(judgingState.medals.silver).toBe(1);
    });

    it('should allow adding reactions after clear', () => {
        judgingState.addReaction('✅', 100, 100);
        judgingState.clear();
        judgingState.addReaction('🎨', 200, 200);

        expect(judgingState.reactions.length).toBe(1);
        expect(judgingState.reactions[0].type).toBe('🎨');
    });

    it('should handle clear on empty state gracefully', () => {
        judgingState.clear();

        expect(judgingState.medals).toEqual({
            gold: 0,
            silver: 0,
            bronze: 0
        });
        expect(judgingState.reactions).toEqual([]);
    });

    it('should support mixed operations', () => {
        judgingState.awardMedal('gold');
        judgingState.addReaction('🏆', 250, 250);
        judgingState.awardMedal('silver');
        judgingState.addReaction('🥇', 750, 750);

        expect(judgingState.medals.gold).toBe(1);
        expect(judgingState.medals.silver).toBe(1);
        expect(judgingState.reactions.length).toBe(2);
    });
});
