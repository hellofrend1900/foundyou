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
