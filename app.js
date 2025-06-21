
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
  document.title = file.name; // Update page title
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
    requestFolderAndLoad();
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
});

nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);

chooseBtn.addEventListener('click', async () => {
  try {
    const dirHandle = await window.showDirectoryPicker(); // No id here!
    const permission = await dirHandle.requestPermission({ mode: 'read' });
    if (permission === 'granted') {
      await loadFilesFromDirectory(dirHandle);
    }
  } catch (e) {
    console.warn('Folder access denied or cancelled');
  }
});

audio.addEventListener('ended', playNext);

// Persistent folder loading
async function requestFolderAndLoad() {
  try {
    const dirHandle = await window.showDirectoryPicker({ id: 'music-folder', mode: 'read' });
    const permission = await dirHandle.requestPermission({ mode: 'read' });
    if (permission === 'granted') {
      await loadFilesFromDirectory(dirHandle);
    }
  } catch (e) {
    console.warn('Folder access denied or cancelled');
  }
}

async function loadFilesFromDirectory(dirHandle) {
  const files = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.mp3')) {
      files.push(await entry.getFile());
    }
  }
  loadPlaylist(files);
}

window.addEventListener('load', async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({ id: 'music-folder', mode: 'read' });
    const permission = await dirHandle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      await loadFilesFromDirectory(dirHandle);
    }
  } catch (e) {
    console.log('No folder auto-loaded or not allowed');
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
