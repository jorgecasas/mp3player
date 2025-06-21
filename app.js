
let audio = new Audio();
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => {
    audio.play();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    audio.pause();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    playPrev();
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    playNext();
  });
}

let playlist = [];
let displayList = [];
let currentIndex = -1;

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
  // Media Session metadata
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: file.name,
      artist: '',
      album: '',
      artwork: []
    });
  }
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

function renderFileList(filteredFiles = null) {
  const listToRender = filteredFiles || displayList;
  const fragment = document.createDocumentFragment();
  fileListUI.innerHTML = '';
  listToRender.forEach((file) => {
    const li = document.createElement('li');
    li.textContent = file.name;
    li.onclick = () => {
      const playIndex = playlist.findIndex(f => f.name === file.name);
      if (playIndex >= 0) playSong(playIndex);
    };
    fragment.appendChild(li);
  });
  fileListUI.appendChild(fragment);
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
  // Media Session metadata
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: file.name,
      artist: '',
      album: '',
      artwork: []
    });
  }
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

// Efficient folder load
async function requestFolderAndLoad(useStored = true) {
  try {
    const options = useStored
      ? { id: 'music-folder', mode: 'read' }
      : { mode: 'read' };

    nowPlaying.textContent = 'Loading songs...';
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

  const files = await Promise.all(filePromises);

  if (files.length) {
    // Defer shuffle and sorting
    requestAnimationFrame(() => {
      playlist = shuffle(files);
      displayList = [...files].sort((a, b) => a.name.localeCompare(b.name));
      renderFileList();
      playSong(0);
    });
  } else {
    alert('No MP3 files found in selected folder.');
    nowPlaying.textContent = '';
  }
}

window.addEventListener('load', async () => {
  await requestFolderAndLoad(true);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
