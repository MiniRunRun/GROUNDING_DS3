// Scroll handler like HTML Review
window.onload = () => {
    handleScroll();
    setupGreenLinks();
    setupModal();
    setupTitleTooltip();
    setupBackToTop();
    setupAmbientSounds();
}

window.onscroll = () => handleScroll();

let hasShownModal = false;

function handleScroll() {
    const root = document.querySelector(':root');

    // Update --scroll variable (drives the translateZ transforms)
    root.style.setProperty('--scroll', Math.floor(window.scrollY) + 'px');

    // Update --visible variable (controls opacity fade)
    root.style.setProperty('--visible', (Math.floor(window.scrollY - 17000) / -100).toFixed(1));

    // Check if scrolled to bottom
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

    const greenOverlay = document.getElementById('greenOverlay');
    const backToTopBtn = document.getElementById('backToTop');
    const backToTopContainer = backToTopBtn.parentElement;
    const modal = document.getElementById('modal');
    const navBox = document.getElementById('navBox');

    if (scrolledToBottom) {
        // Show green overlay
        greenOverlay.classList.add('active');
        // Show back to top button container
        backToTopContainer.classList.add('visible');
        // Auto-open modal (only once)
        if (!hasShownModal) {
            modal.style.display = 'block';
            navBox.classList.add('visible');
            hasShownModal = true;
        }
    } else {
        // Hide green overlay and button when not at bottom
        greenOverlay.classList.remove('active');
        backToTopContainer.classList.remove('visible');
    }
}

// Setup green link interactions
function setupGreenLinks() {
    const greenLinks = document.querySelectorAll('.green-link');

    greenLinks.forEach((link, index) => {
        // Skip green links that have actual hrefs (tree1green at index 0, green 1 at index 1, shrub green A at index 2, tree3 green at index 3, shrub green B at index 4)
        if (index === 0 || index === 1 || index === 2 || index === 3 || index === 4) {
            return;
        }

        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Green link ${index + 1} clicked!`);
            // Add your custom action here
            alert(`You clicked green image #${index + 1}!`);
        });
    });
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('modal');
    const btn = document.getElementById('modalButton');
    const navBox = document.getElementById('navBox');

    // Open modal when button is clicked
    btn.onclick = function() {
        modal.style.display = 'block';
        navBox.classList.add('visible');
    }

    // Close modal when clicking outside of it
    modal.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            navBox.classList.remove('visible');
        }
    }
}

// Setup title box tooltip
function setupTitleTooltip() {
    const titleBox = document.getElementById('titleBox');
    const tooltip = document.getElementById('titleTooltip');

    // Set credits text for tooltip
    const creditsText = `Nicole Sun
Runping Mao-Wei
Susan He
for RISD GD DS3.

Typeset in ABCPressura.`;

    tooltip.textContent = creditsText;

    // Show tooltip on hover
    titleBox.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
    });

    // Hide tooltip when mouse leaves
    titleBox.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

    // Move tooltip with cursor (above cursor)
    titleBox.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY - tooltip.offsetHeight - 15) + 'px';
    });
}

// Setup back to top button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    backToTopBtn.addEventListener('click', () => {
        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        // Reset modal flag so it can show again when reaching bottom
        hasShownModal = false;
    });
}

// Setup ambient sounds to play sporadically
function setupAmbientSounds() {
    // Array of all audio element IDs
    const soundIds = [
        'audio-airplane',
        'audio-bike',
        'audio-bird',
        'audio-car2',
        'audio-children',
        'audio-dog-bark',
        'audio-dogs-walking',
        'audio-duck',
        'audio-footstep',
        'audio-insect',
        'audio-leaves',
        'audio-siren',
        'audio-squirrel',
        'audio-talking',
        'audio-woodpecker'
    ];

    // Set volume for all audio elements and enable autoplay attributes
    soundIds.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.volume = 0.3; // Set to 30% volume
            audio.muted = false;
        }
    });

    // Function to play a random sound
    function playRandomSound() {
        // Get a random sound ID
        const randomIndex = Math.floor(Math.random() * soundIds.length);
        const randomSoundId = soundIds[randomIndex];
        const audio = document.getElementById(randomSoundId);

        if (audio) {
            // Reset audio to beginning and play
            audio.currentTime = 0;
            audio.play().catch(error => {
                // If autoplay is blocked, try again on first user interaction
                console.log('Audio autoplay prevented, will retry on interaction:', error);
                document.addEventListener('click', () => {
                    audio.play().catch(e => console.log('Retry failed:', e));
                }, { once: true });
            });
        }

        // Schedule next sound after a random interval (3-10 seconds)
        const nextInterval = Math.random() * 7000 + 3000; // 3000-10000ms
        setTimeout(playRandomSound, nextInterval);
    }

    // Start playing sounds immediately
    setTimeout(playRandomSound, 1000);
}
