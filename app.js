
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
  const filtered = displayList.filter(file =>
    file.name.toLowerCase().includes(filterText)
  );
  renderFileList(filterText ? filtered : displayList);
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

stopBtn.addEventListener('click', () => audio.pause());
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);

chooseBtn.addEventListener('click', () => {
  requestFolderAndLoad(false);  // force re-pick folder
});

audio.addEventListener('ended', playNext);

// Core permission-aware folder access
async function requestFolderAndLoad(useStored = true) {
  try {
    const options = useStored
      ? { id: 'music-folder', mode: 'read' }
      : { mode: 'read' };

    const dirHandle = await window.showDirectoryPicker(options);
    let permission = await dirHandle.queryPermission({ mode: 'read' });
    if (permission !== 'granted') {
      permission = await dirHandle.requestPermission({ mode: 'read' });
    }
    if (permission === 'granted') {
      await loadFilesFromDirectory(dirHandle);
    } else {
      alert('Permission denied to read the selected folder.');
    }
  } catch (e) {
    console.warn('Folder access cancelled or failed:', e);
  }
}

async function loadFilesFromDirectory(dirHandle) {
  const filePromises = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.mp3')) {
      filePromises.push(entry.getFile());
    }
  }

  // Fetch all files in parallel (faster)
  const files = await Promise.all(filePromises);

  if (files.length) {
    loadPlaylist(files);
  } else {
    alert('No MP3 files found in selected folder.');
  }
}

window.addEventListener('load', async () => {
  await requestFolderAndLoad(true);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
