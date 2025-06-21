let audio = new Audio();
let playlist = [];      // shuffled playback order
let displayList = [];   // alphabetically sorted for UI
let currentIndex = -1;
let isShuffling = true;

const fileInput = document.getElementById('file-input');
const fileListUI = document.getElementById('file-list');
const nowPlaying = document.getElementById('now-playing');
const startBtn = document.getElementById('start-button');
const stopBtn = document.getElementById('stop-button');
const nextBtn = document.getElementById('next-button');
const prevBtn = document.getElementById('prev-button');
const chooseBtn = document.getElementById('choose-folder');

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playSong(index) {
  currentIndex = index;
  const file = playlist[currentIndex];
  audio.src = URL.createObjectURL(file);
  nowPlaying.textContent = file.name;
  document.title = file.name;
  highlightPlayingByFile(file);
  audio.play();
}

function playNext() {
  currentIndex++;
  if (currentIndex >= playlist.length) currentIndex = 0;
  playSong(currentIndex);
}

function playPrev() {
  currentIndex--;
  if (currentIndex < 0) currentIndex = playlist.length - 1;
  playSong(currentIndex);
}

function highlightPlayingByFile(file) {
  document.querySelectorAll('#file-list li').forEach((el) => {
    el.classList.toggle('playing', el.textContent === file.name);
  });
}

function loadPlaylist(files) {
  playlist = shuffle(Array.from(files));
  displayList = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
  renderFileList();
  playSong(0);
}

const filterInput = document.getElementById('filter-input');

function renderFileList(filteredFiles = null) {
  const listToRender = filteredFiles || displayList;
  fileListUI.innerHTML = '';
  listToRender.forEach((file) => {
    const li = document.createElement('li');
    li.textContent = file.name;
    li.onclick = () => {
      const playIndex = playlist.findIndex(f => f.name === file.name);
      if (playIndex >= 0) playSong(playIndex);
    };
    fileListUI.appendChild(li);
  });
}

filterInput.addEventListener('input', () => {
  const filterText = filterInput.value.trim().toLowerCase();
  if (!filterText) {
    renderFileList(displayList);
  } else {
    const filtered = displayList.filter(file =>
      file.name.toLowerCase().includes(filterText)
    );
    renderFileList(filtered);
  }
});

startBtn.addEventListener('click', () => {
  if (playlist.length > 0 && currentIndex === -1) {
    playSong(0);
  } else if (playlist.length > 0) {
    audio.play();
  } else {
    fileInput.click();
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
});

nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);

fileInput.addEventListener('change', (e) => {
  loadPlaylist(e.target.files);
});

chooseBtn.addEventListener('click', () => {
  fileInput.click();
});

audio.addEventListener('ended', playNext);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
