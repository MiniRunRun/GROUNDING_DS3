// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isProcessing = false;

// Invasive species data (6 pairs for 12 cards)
const speciesData = [
    {
        symbol: 'invasive assets/White/oriental bittersweet.png',
        actualPhoto: 'invasive assets/actual photo/oriental bittersweet 2.png',
        name: 'Oriental Bittersweet',
        description: 'Oriental Bittersweet is native to China, Japan, and Korea. It was introduced to North America in the 1860s as an ornamental vine, and it is now widely invasive in forests and disturbed areas. It is present in regions like Blackstone Park. This species climbs and wraps around trees and shrubs, adding weight and restricting growth, which can lead to breakage or death of host trees. It spreads both through bird-dispersed seeds and through underground roots, allowing it to form large patches that displace native vegetation. Its rapid growth reduces habitat quality for local wildlife and contributes to the decline of forest health.'
    },
    {
        symbol: 'invasive assets/White/japanese knotweed.png',
        actualPhoto: 'invasive assets/actual photo/Japanese knotweed 2.png',
        name: 'Japanese Knotweed',
        description: 'Japanese Knotweed (Fallopia japonica) is native to eastern Asia (Japan, China, Korea, Taiwan). It arrived in North America in the late 19th century, and now invades habitats by forming dense thickets that outcompete native plants. They present in Blackstone Park. It grows rapidly and forms dense stands that prevent native plants from accessing the sunlight, water, and soil nutrients they need to survive. The species spreads through an extensive rhizome system, making it difficult to remove once it becomes established. Its presence reduces overall plant diversity and can negatively affect wildlife that depends on native vegetation for habitat.'
    },
    {
        symbol: 'invasive assets/White/Tree of Heaven.png',
        actualPhoto: 'invasive assets/actual photo/Tree of Heaven 2.png',
        name: 'Tree of Heaven',
        description: 'Tree of Heaven is native to China and Taiwan. It was introduced into the United States in the late 1700s as an ornamental tree and has since become a widespread invasive species. It occurs in many urban and disturbed environments including areas near Blackstone Park. This tree grows rapidly and spreads through both seed production and vigorous root suckering, allowing it to dominate forest edges and degraded soils. It also releases chemicals into the soil that suppress other plant species. Tree of Heaven reduces the regeneration of native trees and alters habitat quality as it expands.'
    },
    {
        symbol: 'invasive assets/White/Purple Loosestrife.png',
        actualPhoto: 'invasive assets/actual photo/Purple loosetrife.png',
        name: 'Purple Loosestrife',
        description: 'Purple Loosestrife is native to Europe and parts of Asia. It was introduced accidentally and through garden plantings in the 1800s and is now invasive across wetlands in North America. It may occur near wetland edges around Blackstone Park. This species forms tall, dense stands that outcompete native wetland plants needed for bird and amphibian habitat. It produces extremely high numbers of seeds, allowing it to spread quickly along waterways and disturbed soils. Over time, Purple Loosestrife reduces biodiversity in marshes and impairs the ecological functions of wetland systems.'
    },
    {
        symbol: 'invasive assets/White/Garlic Mustard.png',
        actualPhoto: 'invasive assets/actual photo/Garlic mustard 2.png',
        name: 'Garlic Mustard',
        description: 'Garlic Mustard is native to Europe and parts of Asia. It was introduced to North America in the 19th century for culinary and medicinal uses and has since become invasive in woodlands and shaded habitats. It is found in areas such as Blackstone Park. This plant grows in dense clusters that block sunlight and resources from native wildflowers. It spreads quickly by producing large quantities of seeds and also releases chemicals into the soil that interfere with native plant growth and mycorrhizal fungi. Garlic Mustard reduces biodiversity in forest understories and alters ecosystem processes over time.'
    },
    {
        symbol: 'invasive assets/White/multiflora rose.png',
        actualPhoto: 'invasive assets/actual photo/multiflora rose 2.png',
        name: 'Multiflora Rose',
        description: 'Multiflora Rose is native to eastern Asia, including Japan, Korea, and China. It was introduced to North America in the early 1800s for erosion control and as a living fence, but it has since become invasive. It is found in natural areas like Blackstone Park. This species forms dense, thorny thickets that restrict movement for wildlife and block native plants from establishing. It spreads by prolific seed production and by arching stems that root when they touch the ground. The large seed bank allows populations to persist for decades, leading to long-term changes in habitat structure and species composition.'
    }
];

const symbols = speciesData.map(s => s.symbol);

// Initialize game
function initGame() {
    // Reset game state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    isProcessing = false;

    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Clear matched info
    document.getElementById('matched-info').innerHTML = '';

    // Update UI
    updateStats();

    // Create card pairs
    const cardSymbols = [...symbols, ...symbols];

    // Shuffle cards
    shuffleArray(cardSymbols);

    // Create card elements
    const gameContainer = document.querySelector('.game');
    gameContainer.innerHTML = '';

    cardSymbols.forEach((symbol, index) => {
        const card = createCard(symbol, index);
        cards.push(card);
        gameContainer.appendChild(card.element);
    });

    // Hide modal
    document.querySelector('.modal-overlay').classList.remove('show');
}

// Create a card element
function createCard(symbol, index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.symbol = symbol;
    cardElement.dataset.index = index;

    // Create card content with image
    const content = document.createElement('div');
    content.className = 'card-content';

    const img = document.createElement('img');
    img.src = symbol;
    img.alt = 'Invasive Species';
    img.className = 'card-image';
    content.appendChild(img);

    cardElement.appendChild(content);

    // Add click event
    cardElement.addEventListener('click', () => handleCardClick(cardElement));

    return {
        element: cardElement,
        symbol: symbol,
        isFlipped: false,
        isMatched: false
    };
}

// Handle card click
function handleCardClick(cardElement) {
    // Prevent interaction during processing or if card is already revealed/matched
    if (isProcessing ||
        cardElement.classList.contains('revealed') ||
        cardElement.classList.contains('matched') ||
        cardElement.classList.contains('revealing')) {
        return;
    }

    // Start timer on first move
    if (moves === 0 && !timerInterval) {
        startTimer();
    }

    // Reveal card with flip animation (no crystalline animation yet)
    revealCard(cardElement);

    // Add to flipped cards
    flippedCards.push(cardElement);

    // Check for match when two cards are flipped
    if (flippedCards.length === 2) {
        isProcessing = true;
        moves++;
        updateStats();

        setTimeout(() => {
            checkForMatch();
        }, 300);
    }
}

// Reveal card with flip effect
function revealCard(cardElement) {
    cardElement.classList.add('revealing');

    setTimeout(() => {
        cardElement.classList.remove('revealing');
        cardElement.classList.add('revealed');
    }, 250);
}

// Hide card with flip effect
function hideCard(cardElement) {
    cardElement.classList.add('hiding');

    setTimeout(() => {
        cardElement.classList.remove('hiding', 'revealed');
    }, 250);
}

// Check if two flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;

    if (symbol1 === symbol2) {
        // Match found - play crystalline refraction animation
        if (typeof window.playCrystallineRefraction === 'function') {
            window.playCrystallineRefraction(card1, 600);
            window.playCrystallineRefraction(card2, 600);
        }

        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;

        // Add species info to sidebar
        addSpeciesInfo(symbol1);

        // Update stats
        updateStats();

        // Check if game is won
        if (matchedPairs === symbols.length) {
            setTimeout(() => {
                endGame();
            }, 500);
        }
    } else {
        // No match - flip back directly without shake animation
        setTimeout(() => {
            hideCard(card1);
            hideCard(card2);
        }, 250);
    }

    // Reset flipped cards
    flippedCards = [];
    isProcessing = false;
}

// Add matched species info to sidebar with stacking
function addSpeciesInfo(symbol) {
    const species = speciesData.find(s => s.symbol === symbol);
    if (!species) return;

    const infoContainer = document.getElementById('matched-info');

    const speciesCard = document.createElement('div');
    speciesCard.className = 'species-card';
    speciesCard.dataset.cardIndex = infoContainer.children.length;

    speciesCard.innerHTML = `
        <h3>${species.name}</h3>
        <div class="species-icon">
            <img src="${species.actualPhoto}" alt="${species.name}" class="species-image">
        </div>
        <p>${species.description}</p>
    `;

    // Add click handler to bring card to top
    speciesCard.addEventListener('click', function(e) {
        e.stopPropagation();
        bringCardToTop(this);
    });

    infoContainer.appendChild(speciesCard);

    // Position cards in stack
    updateCardStack();

    // Animate new card in
    speciesCard.style.animation = 'slideUpCard 0.6s cubic-bezier(.5, 0, .2, 1) forwards';
}

// Update card positions in stack
function updateCardStack() {
    const infoContainer = document.getElementById('matched-info');
    const cards = Array.from(infoContainer.children);
    const totalCards = cards.length;

    cards.forEach((card, index) => {
        const offsetFromTop = (totalCards - 1 - index) * 20; // Each card 20px below the previous
        const zIndex = index + 1; // Higher index = on top

        card.style.top = `${offsetFromTop}px`;
        card.style.zIndex = zIndex;

        // Slightly scale down cards below
        const scale = 1 - ((totalCards - 1 - index) * 0.02);
        card.style.transform = `scale(${scale})`;
    });
}

// Bring clicked card to the top
function bringCardToTop(clickedCard) {
    const infoContainer = document.getElementById('matched-info');
    const cards = Array.from(infoContainer.children);

    // Remove and re-append the clicked card to make it last (highest z-index)
    infoContainer.removeChild(clickedCard);
    infoContainer.appendChild(clickedCard);

    // Animate the card movement
    clickedCard.style.animation = 'bringToTop 0.4s cubic-bezier(.5, 0, .2, 1) forwards';

    // Update all card positions
    setTimeout(() => {
        updateCardStack();
    }, 50);
}

// Animation for bringing card to top
const style = document.createElement('style');
style.textContent = `
    @keyframes bringToTop {
        0% {
            transform: scale(0.98);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        updateStats();
    }, 1000);
}

// Update stats display (stats removed from UI, function kept for compatibility)
function updateStats() {
    // Stats display has been removed
    // This function is kept to prevent errors in other parts of the code
}

// End game
function endGame() {
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Show completion stats
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;

    document.querySelector('.completion-stats').textContent =
        `Completed in ${moves} moves and ${timeString}`;

    // Show modal
    setTimeout(() => {
        document.querySelector('.modal-overlay').classList.add('show');
    }, 500);
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup intro animation (from type.js)
    if (typeof setupIntroAnimation === 'function') {
        setupIntroAnimation();
    }

    // Initialize game
    initGame();

    // Restart button
    document.querySelector('.restart').addEventListener('click', () => {
        initGame();
    });
});
