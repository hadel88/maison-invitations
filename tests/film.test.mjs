import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cinemaThemes } from '../src/cinemaThemes.js';
const { checkEvent } = await import('../api/app.js');

test('the Castle Gates film design is in the collection and its files ship with the site', () => {
  const t = cinemaThemes.find((x) => x.id === 'castle-gates');
  assert.equal(t?.kind, 'film');
  for (const f of ['castle-film.mp4', 'castle-film.webm', 'castle-film-end.webp', 'castle-pocket.webp', t.cover + '.webp', t.cover + '-sm.webp'])
    assert.ok(existsSync(new URL('../public/' + f, import.meta.url)), f + ' is missing');
});

test('the second frame photo must be an uploaded image like the first', () => {
  const base = { names: 'A & B', date: '2027-06-12', time: '17:00', rsvpDeadline: '2027-05-01', timezone: 'Europe/Paris' };
  const img = 'data:image/jpeg;base64,/9j/4AAQ';
  assert.doesNotThrow(() => checkEvent({ ...base, photo: img, photo2: img }));
  assert.doesNotThrow(() => checkEvent({ ...base, photo2: '' }));
  assert.throws(() => checkEvent({ ...base, photo2: 'https://example.com/tracker.png' }), /photo/);
  assert.throws(() => checkEvent({ ...base, photo2: 42 }), /photo/);
  assert.doesNotThrow(() => checkEvent({ ...base, photo: img, photo2: img, photo3: img, photo4: img }));
  assert.throws(() => checkEvent({ ...base, photo4: 'javascript:alert(1)' }), /photo/);
});

test('Once Upon a Castle ships its film, stills and tracked surfaces', async () => {
  const t = cinemaThemes.find((x) => x.id === 'castle-story');
  assert.equal(t?.kind, 'story');
  for (const f of ['story-film.mp4', 'story-film.webm', 'story-film-end.webp', 'story-film-poster.webp', t.cover + '.webp', t.cover + '-sm.webp'])
    assert.ok(existsSync(new URL('../public/' + f, import.meta.url)), f + ' is missing');
  const { default: data } = await import('../src/storyFilm.json', { with: { type: 'json' } });
  assert.equal(data.fps, 30);
  const items = data.frames.flat();
  assert.ok(items.some((x) => x[0] === 0) && items.some((x) => x[1] === 'card') && items.some((x) => x[1] === 'letter'));
  for (const x of items) assert.equal(x.length, 12);
});
