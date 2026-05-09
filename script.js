const form = document.getElementById('post-form');
const postsList = document.getElementById('posts-list');
const fileInput = document.getElementById('media-file');

const STORAGE_KEY = 'oldFashionedMediaBoardPosts';

function loadPosts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function createPostElement(post) {
  const card = document.createElement('article');
  card.className = 'post-card';

  const meta = document.createElement('div');
  meta.className = 'post-meta';

  const dateLabel = document.createElement('span');
  dateLabel.textContent = `Posted: ${new Date(post.createdAt).toLocaleString()}`;
  meta.appendChild(dateLabel);

  if (post.fileName) {
    const fileLabel = document.createElement('span');
    fileLabel.textContent = `File: ${post.fileName}`;
    meta.appendChild(fileLabel);
  }

  card.appendChild(meta);

  if (post.description) {
    const desc = document.createElement('div');
    desc.className = 'post-description';
    desc.textContent = post.description;
    card.appendChild(desc);
  }

  const content = document.createElement('div');
  content.className = 'post-content';

  if (post.type && post.dataUrl) {
    if (post.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = post.dataUrl;
      img.alt = post.fileName || 'Uploaded image';
      content.appendChild(img);
    } else if (post.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = post.dataUrl;
      video.controls = true;
      content.appendChild(video);
    }
  }

  if (post.linkUrl && post.linkText) {
    const link = document.createElement('a');
    link.className = 'post-link';
    link.href = post.linkUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = post.linkText;
    content.appendChild(link);
  } else if (post.linkUrl) {
    const link = document.createElement('a');
    link.className = 'post-link';
    link.href = post.linkUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = post.linkUrl;
    content.appendChild(link);
  }

  card.appendChild(content);
  return card;
}

function renderPosts() {
  if (!postsList) return;
  const posts = loadPosts();
  postsList.innerHTML = '';

  if (!posts.length) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'No posts yet. Add a file, description, or link to see it appear here.';
    postsList.appendChild(hint);
    return;
  }

  posts.slice().reverse().forEach((post) => {
    postsList.appendChild(createPostElement(post));
  });
}

function addPost(post) {
  const posts = loadPosts();
  posts.push(post);
  savePosts(posts);
  renderPosts();
}

function resetForm() {
  if (form) form.reset();
}

if (form && fileInput) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  const file = fileInput.files[0];
  const description = document.getElementById('media-description').value.trim();
  const linkUrl = document.getElementById('link-url').value.trim();
  const linkText = document.getElementById('link-text').value.trim();

  if (!file && !linkUrl && !description) {
    alert('Please choose a file, add a description, or enter a link to create a post.');
    return;
  }

  const newPost = {
    createdAt: Date.now(),
    description,
    linkUrl,
    linkText,
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newPost.type = file.type;
      newPost.fileName = file.name;
      newPost.dataUrl = reader.result;
      addPost(newPost);
      resetForm();
    };
    reader.readAsDataURL(file);
  } else {
    addPost(newPost);
    resetForm();
  }
  });
}

renderPosts();

const visitCode = document.querySelector('.visit-code');
const VISIT_CODE_KEY = 'foundYouVisitCode';
const VISIT_COUNTER_OFFSET = -4; // Drop by 1 whenever a site-change visit needs cancelling out.

if (visitCode) {
  try {
    const rawVisitCount = Number(localStorage.getItem(VISIT_CODE_KEY) || '0') + 1;
    const visibleVisitCount = Math.max(0, rawVisitCount + VISIT_COUNTER_OFFSET);

    localStorage.setItem(VISIT_CODE_KEY, String(rawVisitCount));
    visitCode.textContent = String(visibleVisitCount).padStart(9, '0');
  } catch (error) {
    visitCode.textContent = '000000000';
  }
}

const delayedHomeMessage = document.querySelector('.delayed-home-message');

function rectsOverlap(firstRect, secondRect, buffer = 28) {
  return !(
    firstRect.right + buffer < secondRect.left ||
    firstRect.left - buffer > secondRect.right ||
    firstRect.bottom + buffer < secondRect.top ||
    firstRect.top - buffer > secondRect.bottom
  );
}

function overlapArea(firstRect, secondRect, buffer = 28) {
  const left = Math.max(firstRect.left, secondRect.left - buffer);
  const top = Math.max(firstRect.top, secondRect.top - buffer);
  const right = Math.min(firstRect.right, secondRect.right + buffer);
  const bottom = Math.min(firstRect.bottom, secondRect.bottom + buffer);

  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function findOpenPosition(element, blockers) {
  const margin = 24;
  const elementRect = element.getBoundingClientRect();
  const elementWidth = Math.max(elementRect.width, 120);
  const elementHeight = Math.max(elementRect.height, 32);
  const maxLeft = Math.max(margin, window.innerWidth - elementWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - elementHeight - margin);
  let chosenPosition = {
    left: margin + Math.random() * Math.max(1, maxLeft - margin),
    top: margin + Math.random() * Math.max(1, maxTop - margin),
  };
  let lowestOverlap = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const left = margin + Math.random() * Math.max(1, maxLeft - margin);
    const top = margin + Math.random() * Math.max(1, maxTop - margin);
    const candidateRect = {
      left,
      top,
      right: left + elementWidth,
      bottom: top + elementHeight,
    };
    const overlapScore = blockers.reduce(
      (total, blockerRect) => total + overlapArea(candidateRect, blockerRect),
      0
    );

    if (overlapScore < lowestOverlap) {
      lowestOverlap = overlapScore;
      chosenPosition = { left, top };
    }

    if (!blockers.some((blockerRect) => rectsOverlap(candidateRect, blockerRect))) {
      chosenPosition = { left, top };
      break;
    }
  }

  return {
    left: chosenPosition.left,
    top: chosenPosition.top,
    right: chosenPosition.left + elementWidth,
    bottom: chosenPosition.top + elementHeight,
  };
}

function positionDelayedHomeMessage() {
  if (!delayedHomeMessage) return;

  const blockers = Array.from(document.querySelectorAll('nav, body p'))
    .filter((element) => !delayedHomeMessage.contains(element))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  const placedRects = [...blockers];
  const messageParts = Array.from(delayedHomeMessage.children);

  messageParts.forEach((messagePart) => {
    messagePart.style.left = '0';
    messagePart.style.top = '0';
  });

  messageParts.forEach((messagePart) => {
    const chosenRect = findOpenPosition(messagePart, placedRects);
    messagePart.style.left = `${chosenRect.left}px`;
    messagePart.style.top = `${chosenRect.top}px`;
    placedRects.push(chosenRect);
  });
}

if (delayedHomeMessage) {
  positionDelayedHomeMessage();
  window.addEventListener('resize', positionDelayedHomeMessage);
  window.setInterval(positionDelayedHomeMessage, 24000);
}

function setYouTubeThumbnail(videoBox, encodedVideoId) {
  const thumbnails = [
    `https://i.ytimg.com/vi_webp/${encodedVideoId}/maxresdefault.webp`,
    `https://i.ytimg.com/vi/${encodedVideoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi_webp/${encodedVideoId}/sddefault.webp`,
    `https://i.ytimg.com/vi/${encodedVideoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi_webp/${encodedVideoId}/hqdefault.webp`,
    `https://i.ytimg.com/vi/${encodedVideoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${encodedVideoId}/0.jpg`,
  ];

  let thumbnailIndex = 0;

  function tryThumbnail() {
    if (thumbnailIndex >= thumbnails.length) return;

    const thumbnailUrl = thumbnails[thumbnailIndex];
    const thumbnail = new Image();

    thumbnail.onload = () => {
      const isMissingThumbnail = thumbnail.naturalWidth <= 120 && thumbnail.naturalHeight <= 90;

      if (isMissingThumbnail && thumbnailIndex < thumbnails.length - 1) {
        thumbnailIndex += 1;
        tryThumbnail();
        return;
      }

      videoBox.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.42)), url("${thumbnailUrl}")`;
      videoBox.classList.add('has-thumbnail');
    };

    thumbnail.onerror = () => {
      thumbnailIndex += 1;
      tryThumbnail();
    };

    thumbnail.src = thumbnailUrl;
  }

  tryThumbnail();
}

document.querySelectorAll('.secret-video-box[data-youtube-id]').forEach((videoBox) => {
  const videoId = videoBox.dataset.youtubeId;
  const title = videoBox.dataset.videoTitle || 'Secret video';
  const trigger = videoBox.querySelector('.secret-video-trigger');

  const encodedVideoId = encodeURIComponent(videoId);
  setYouTubeThumbnail(videoBox, encodedVideoId);

  if (!trigger) return;

  trigger.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${encodedVideoId}?autoplay=1&controls=0&rel=0&playsinline=1`;
    iframe.title = title;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;

    videoBox.classList.add('is-playing');
    videoBox.style.backgroundImage = '';
    videoBox.replaceChildren(iframe);
  });
});

const liveMessageWindow = document.querySelector('.friend-message-window[data-live-log]');

if (liveMessageWindow) {
  const firstLiveMessage = "hello frend. youve found me";

  // Add new lines here. One message appears every 60 seconds after the first.
  const liveMessages = [
    'i am still here.',
    'i can see youre still there. are you here to help?',
    'maybe you can be my friend?',
    'if you already have im sorry. its hard to receive messages here properly.',
    'HE stores them underground in a door.',
    'its not a normal door. i remember being put in it once',
    'then all i remember was here.',
    'dont look too long. he looks back.',
    'have you seen the door in the ground?',
    'have you been here before?',
  ];
  let liveMessageIndex = 0;

  function getLiveMessageTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function appendLiveMessage(messageText) {
    const message = document.createElement('p');
    const time = document.createElement('span');

    time.textContent = getLiveMessageTime();
    message.appendChild(time);
    message.append(` ${messageText}`);
    liveMessageWindow.appendChild(message);
    liveMessageWindow.scrollTop = liveMessageWindow.scrollHeight;
  }

  liveMessageWindow.replaceChildren();
  appendLiveMessage(firstLiveMessage);

  window.setInterval(() => {
    appendLiveMessage(liveMessages[liveMessageIndex]);
    liveMessageIndex = (liveMessageIndex + 1) % liveMessages.length;
  }, 60000);
}

const deniedMessageLink = document.querySelector('.friend-message-denied');

if (deniedMessageLink) {
  deniedMessageLink.addEventListener('click', (event) => {
    event.preventDefault();
    deniedMessageLink.textContent = 'its not time';
    window.setTimeout(() => {
      deniedMessageLink.textContent = 'send message';
    }, 3000);
  });
}

const forwardLink = document.querySelector('.friend-forward-link');
const copyNotice = document.querySelector('.friend-copy-notice');

if (forwardLink) {
  forwardLink.addEventListener('click', async (event) => {
    event.preventDefault();

    const homeUrl = new URL('index.html', window.location.href).href;

    try {
      await navigator.clipboard.writeText(homeUrl);
      if (copyNotice) copyNotice.textContent = 'home copied to clipboard';
    } catch (error) {
      if (copyNotice) copyNotice.textContent = homeUrl;
    }

    if (copyNotice) {
      window.setTimeout(() => {
        copyNotice.textContent = '';
      }, 3000);
    }
  });
}
