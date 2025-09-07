// ------------------------------------------------------
// HOME sayfası: Story & Kategori accordion
// ------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {

  // ---- Kategori accordion ----
  document.querySelectorAll('.category-header').forEach(function (header) {
    header.addEventListener('click', function () {
      header.classList.toggle('active');
      const content = header.nextElementSibling;
      if (!content) return;
      const opened = content.classList.toggle('open');
      if (!opened) content.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
    });
  });

  // ---- Story popup ----
  const logoTrigger = document.getElementById('logoStoryTrigger');  // <-- EŞLEŞTİRİLDİ
  const storyPopup  = document.getElementById('storyPopup');
  const storyClose  = document.getElementById('storyClose');
  const storyNext   = document.getElementById('storyNext');
  const storyPrev   = document.getElementById('storyPrev');
  const storyProgressContainer = document.getElementById('storyProgressContainer');
  const storyImgs   = document.querySelectorAll('.story-img');

  const stories = Array.from(storyImgs).map(img => ({
    src: img.src,
    id:  img.dataset.storyId || img.dataset.id
  }));

  let currentStory = 0;
  let storyTimer;
  let progress = 0;
  const storyDuration = 5000; // ms

  function increment(storyId){
    if(!storyId) return;
    fetch('/Story/IncrementView/' + storyId, { method: 'POST' }).catch(()=>{});
  }

  function initProgressBars() {
    if (!storyProgressContainer) return;
    storyProgressContainer.innerHTML = '';
    stories.forEach(() => {
      const bar = document.createElement('div');
      bar.className = 'story-progress';
      const inner = document.createElement('div');
      inner.className = 'story-progress-inner';
      bar.appendChild(inner);
      storyProgressContainer.appendChild(bar);
    });
  }

  function updateProgressBars() {
    const bars = document.querySelectorAll('.story-progress-inner');
    bars.forEach((b, i) => {
      b.style.width = (i < currentStory) ? '100%' : (i === currentStory ? progress + '%' : '0%');
    });
  }

  function startProgress() {
    clearInterval(storyTimer);
    progress = 0;
    storyTimer = setInterval(function () {
      progress += 100 / (storyDuration / 50);
      updateProgressBars();
      if (progress >= 100) nextStory();
    }, 50);
  }

  function showStory(index) {
    if (!storyImgs.length) return;
    currentStory = index;
    storyImgs.forEach((img, i) => {
      img.style.display = (i === index) ? 'block' : 'none';
    });
    updateProgressBars();
    startProgress();

    // görüntüleme sayacı
    const storyId = stories[index] && stories[index].id;
    increment(storyId);
  }

  function nextStory() { showStory((currentStory + 1) % stories.length); }
  function prevStory() { showStory((currentStory - 1 + stories.length) % stories.length); }

  if (logoTrigger && storyPopup && stories.length) {
    logoTrigger.addEventListener('click', () => {
      storyPopup.style.display = 'flex';
      initProgressBars();
      showStory(0);                     // <-- ilk görsel anında göster
    });
  }
  if (storyClose) storyClose.addEventListener('click', () => { storyPopup.style.display = 'none'; clearInterval(storyTimer); });
  if (storyNext)  storyNext .addEventListener('click', () => { clearInterval(storyTimer); nextStory(); });
  if (storyPrev)  storyPrev .addEventListener('click', () => { clearInterval(storyTimer); prevStory(); });

});
