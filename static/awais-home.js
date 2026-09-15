// Preserve the original source photo URLs and explain unavailable photos.
document.querySelectorAll('img[src^="https://www.awaispackages.com/"]').forEach(img => {
  const unavailable = () => {
    img.classList.add('source-image-unavailable');
    if (!img.parentElement.querySelector('.source-photo-note')) {
      const note = document.createElement('span');
      note.className = 'source-photo-note';
      note.textContent = 'Awais Packages photo is currently unavailable.';
      img.parentElement.append(note);
    }
  };
  img.addEventListener('error', unavailable);
  img.addEventListener('load', () => {
    img.classList.remove('source-image-unavailable');
    img.parentElement.querySelector('.source-photo-note')?.remove();
  });
  if (img.complete && !img.naturalWidth) unavailable();
});
