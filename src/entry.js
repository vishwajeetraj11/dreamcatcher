const route = window.location.pathname.replace(/\/+$/, '') || '/';

if (route === '/home') {
  await import('./home.js');
} else if (route === '/moodboard') {
  await import('./moodboard.js');
} else {
  await import('./main.js');
}
