
/* ==========================================================================
   INTRO ANIMATION
   /* ==========================================================================
   Intro typing + wipeout
   ========================================================================== */
   function setupIntroAnimation() {
    const introScreen = document.getElementById('intro-screen');
    const spans = introScreen.querySelectorAll('.intro-text span');
  
    const charMs = 50; // typing speed (ms per char)
    let maxDuration = 0;
  
    spans.forEach(span => {
      const fullText = span.textContent;
  
      // measure final width so the box doesn't jiggle
      const measure = document.createElement('span');
      measure.style.visibility = 'hidden';
      measure.style.whiteSpace = 'pre';
      measure.style.position = 'absolute';
      measure.textContent = fullText;
      document.body.appendChild(measure);
      const finalWidth = measure.offsetWidth;
      document.body.removeChild(measure);
  
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'pre';
      span.style.minWidth = `${finalWidth}px`;
  
      // record duration for this span
      const duration = fullText.length * charMs;
      if (duration > maxDuration) maxDuration = duration;
  
      // type
      span.textContent = '';
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullText.length) {
          span.textContent += fullText[i++];
        } else {
          clearInterval(interval);
        }
      }, charMs);
    });
  
    // after all lines have finished typing, add wipeout
    const bufferAfterTyping = 400; // small pause before wipe
    const wipeAnimDurationMs = 700; // keep in sync with CSS
  
    setTimeout(() => {
      // start the wipe
      introScreen.classList.add('wipeout');
  
      // when the CSS animation ends, remove the screen
      const handleAnimEnd = () => {
        introScreen.removeEventListener('animationend', handleAnimEnd);
        introScreen.style.display = 'none';
      };
      introScreen.addEventListener('animationend', handleAnimEnd);
  
      // safety fallback: remove if no animationend fires
      setTimeout(() => {
        introScreen.style.display = 'none';
      }, wipeAnimDurationMs + 150);
    }, maxDuration + bufferAfterTyping);
  }
  
  