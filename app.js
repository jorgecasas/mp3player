let audio = new Audio();
let playlist = [];
let displayList = [];
let currentIndex = -1;

const fileInput = document.getElementById('file-input');
const fileListUI = document.getElementById('file-list');
const nowPlaying = document.getElementById('now-playing');
const startBtn = document.getElementById('start-button');
const stopBtn = document.getElementById('stop-button');
const nextBtn = document.getElementById('next-button');
const prevBtn = document.getElementById('prev-button');
const chooseBtn = document.getElementById('choose-folder');
const filterInput = document.getElementById('filter-input');

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
  currentIndex = (currentIndex + 1) % playlist.length;
  playSong(currentIndex);
}

function playPrev() {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
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

function renderFileList(filtered = null) {
  const list = filtered || displayList;
  fileListUI.innerHTML = '';
  list.forEach(file => {
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
  const term = filterInput.value.toLowerCase().trim();
  if (term === "") {
    renderFileList();
  } else {
    const filtered = displayList.filter(file => file.name.toLowerCase().includes(term));
    renderFileList(filtered);
  }
});

startBtn.onclick = () => {
  if (playlist.length > 0 && currentIndex === -1) {
    playSong(0);
  } else if (playlist.length > 0) {
    audio.play();
  } else {
    fileInput.click();
  }
};

stopBtn.onclick = () => audio.pause();
nextBtn.onclick = playNext;
prevBtn.onclick = playPrev;
chooseBtn.onclick = () => fileInput.click();

fileInput.onchange = e => loadPlaylist(e.target.files);
audio.onended = playNext;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
