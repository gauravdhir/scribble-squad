/**
 * Lobby Renderer - Responsible for creating the Discovery Lobby UI.
 * Strictly follows the premium glassmorphic mock.
 */
import { createElement } from '../../lib/dom.js';

export function createLobbyUI(parties, onCreateSquad, onKnock, onJoinByCode) {
    const container = createElement('div', { classes: ['lobby-wrapper'] });

    // 1. Hero Section (Create Your Squad + Join by Code)
    const hero = createElement('section', { classes: ['hero-section'] });
    const createCard = createElement('div', { classes: ['create-card'] });
    createCard.innerHTML = `
    <h2 class="create-text">
        <span>CREATE YOUR</span>
        <span>SQUAD ✏️</span>
    </h2>
  `;
    createCard.style.cursor = 'pointer';
    createCard.onclick = onCreateSquad;
    hero.appendChild(createCard);

    // Room Code Input
    const joinSection = createElement('div', { classes: ['join-section'] });
    joinSection.innerHTML = `
        <label class="join-label">Or join with code:</label>
        <div class="join-input-wrapper">
            <input type="text" class="room-code-input" placeholder="ROOM CODE" maxlength="4"/>
            <button class="btn-join">JOIN</button>
        </div>
    `;

    const input = joinSection.querySelector('.room-code-input');
    const joinBtn = joinSection.querySelector('.btn-join');
    const handleJoin = () => {
        const code = input.value.trim().toUpperCase();
        if (code.length === 4) onJoinByCode(code);
    };
    joinBtn.onclick = handleJoin;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleJoin(); };

    hero.appendChild(joinSection);
    container.appendChild(hero);

    // 2. Discovery Section
    const discovery = createElement('section', { classes: ['discovery-section'] });
    const discoveryHeader = createElement('div', { classes: ['discovery-header'] });
    discoveryHeader.innerHTML = `
        <h2 class="discovery-title">DISCOVERY LOBBY</h2>
    `;
    discovery.appendChild(discoveryHeader);

    const grid = createElement('div', { classes: ['discovery-grid'] });

    if (parties.length === 0) {
        const emptyMessage = createElement('div', { classes: ['empty-lobby-message'] });
        emptyMessage.innerHTML = `
            <div class="empty-icon">🚀</div>
            <p>No active rooms yet</p>
            <p class="empty-subtitle">Create your squad to get started!</p>
        `;
        grid.appendChild(emptyMessage);
    } else {
        parties.forEach(party => {
            const card = createPartyCard(party, onKnock);
            grid.appendChild(card);
        });
    }

    discovery.appendChild(grid);
    container.appendChild(discovery);

    return container;
}

function createPartyCard(party, onKnock) {
    const card = createElement('div', { classes: ['party-card'] });

    if (party.isHost) {
        const badge = createElement('div', { text: 'HOST', classes: ['host-badge'] });
        card.appendChild(badge);
    }

    const content = createElement('div', { classes: ['card-content'] });

    const main = createElement('div', { classes: ['party-main'] });
    main.appendChild(createElement('h3', { text: party.name.toUpperCase(), classes: ['party-name'] }));
    content.appendChild(main);

    // Description (Optional)
    if (party.description && party.description.trim() !== '') {
        const description = createElement('p', {
            text: party.description,
            classes: ['party-description']
        });
        content.appendChild(description);
    }

    card.appendChild(content);

    // Circular Knock Button at the bottom center, partially overlapping
    const btnWrapper = createElement('div', { classes: ['knock-btn-wrapper'] });
    const knockBtn = createElement('button', {
        classes: ['btn-circle-knock'],
    });

    const isFull = party.currentPlayers >= party.maxPlayers;
    const isPrivate = !!party.isPrivate;

    knockBtn.innerHTML = `<span class="knock-text">${isFull ? 'FULL' : 'KNOCK'}</span>`;

    if (isFull) {
        knockBtn.disabled = true;
        knockBtn.classList.add('disabled');
    } else if (isPrivate && !party.isHost) {
        knockBtn.disabled = true;
        knockBtn.classList.add('disabled', 'private');
        knockBtn.title = 'This room is private. You need the room code from the room host to join the room.';
        knockBtn.innerHTML = `<span class="knock-text">PRIVATE</span>`;
    }
    knockBtn.onclick = () => onKnock(party.id);

    btnWrapper.appendChild(knockBtn);
    card.appendChild(btnWrapper);

    return card;
}
