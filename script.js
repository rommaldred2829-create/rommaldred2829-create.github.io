(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* Toast */
  const toast = $('#toast');
  let toastTimer;
  const notify = msg => {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 3200);
  };

  /* Theme toggle (remembers choice when storage is available) */
  const themeBtn = $('#themeToggle');
  const setTheme = t => {
    root.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? '☀' : '☾';
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  try { setTheme(localStorage.getItem('theme') || 'dark'); } catch { setTheme('dark'); }
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
  });

  /* Mobile menu */
  const burger = $('#burger'), menu = $('#menu');
  const toggleMenu = open => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('is-open')));
  $$('.nav__link').forEach(l => l.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* Active nav link */
  const links = $$('.nav__link');
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id === 'experience' ? 'services' : en.target.id;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => navObs.observe(s));

  /* Scroll reveal + counters */
  const animateCount = el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '', start = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-visible');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(el => revealObs.observe(el));
  // Stats sit inside a revealed block; also watch them directly so they count when seen
  const statObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { animateCount($('.stat__n', en.target)); obs.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('.stat').forEach(s => statObs.observe(s));

  /* Typing animation */
  const typed = $('#typed');
  const words = ['Web Developer', 'Database Builder', 'Cyber Security Learner'];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed.textContent = words[0];
  } else {
    let w = 0, c = 0, del = false;
    const type = () => {
      const word = words[w];
      typed.textContent = word.slice(0, del ? --c : ++c);
      let wait = del ? 45 : 95;
      if (!del && c === word.length) { del = true; wait = 1600; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; wait = 400; }
      setTimeout(type, wait);
    };
    type();
  }

  /* Project filtering */
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    $$('.project').forEach(p => p.classList.toggle('is-hidden', btn.dataset.filter !== 'all' && p.dataset.category !== btn.dataset.filter));
  }));
  document.addEventListener('click', e => {
    if (e.target.closest('.js-soon')) { e.preventDefault(); notify('This link will be available soon.'); }
  });

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* GitHub connection: set your username and repository name here, once.
     Every "Source Code" button and GitHub link on the page then points to your repo. */
  const GITHUB = { user: 'rommaldred2829-create', repo: 'rommaldred2829-create.github.io', branch: 'main' };
  const ghReady = GITHUB.user && GITHUB.user !== 'your-username';
  const ghUrl = path => {
    if (/^https?:\/\//.test(path || '')) return path; // a full link works too
    if (!ghReady) return '';
    const base = `https://github.com/${GITHUB.user}/${GITHUB.repo}`;
    return path ? `${base}/tree/${GITHUB.branch}/${path}` : base;
  };
  const linkGh = a => {
    const url = ghUrl(a.dataset.gh);
    if (!url) return;
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.classList.remove('js-soon');
  };
  $$('[data-gh]').forEach(linkGh);

  /* Latest repositories, loaded live from the GitHub API.
     If the username isn't set, the request fails, or GitHub's rate limit is hit,
     the section simply stays hidden. */
  const loadRepos = async () => {
    if (!ghReady) return;
    const url = 'https://api.github.com/users/' + encodeURIComponent(GITHUB.user) + '/repos?sort=updated&per_page=6';
    try {
      const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('GitHub API error ' + res.status);
      const repos = (await res.json()).filter(r => !r.fork);
      if (!repos.length) return;
      $('#repoList').innerHTML = repos.map(r => `<a class="repo glass" href="${esc(r.html_url)}" target="_blank" rel="noopener"><strong>${esc(r.name)}</strong><p>${esc(r.description || 'No description yet.')}</p><small>${esc(r.language || 'Mixed')} &middot; &#9733; ${+r.stargazers_count} &middot; updated ${esc(r.updated_at.slice(0, 10))}</small></a>`).join('');
      $('#repoSection').hidden = false;
    } catch (err) {
      console.warn(err.message);
    }
  };
  loadRepos();

  /* Skills, projects and services come from data/portfolio.json.
     If the file can't be loaded (for example when opened straight from disk),
     the HTML already on the page is used instead. */
  const linkBtn = (url, label, style) => /^(https?:\/\/|\w[\w./-]*$)/.test(url || '')
    ? `<a href="${esc(url)}" class="btn btn--sm btn--${style}">${label}</a>`
    : `<a href="#" class="btn btn--sm btn--${style} js-soon">${label}</a>`;
  const srcBtn = path => `<a href="#" data-gh="${esc(path || '')}" class="btn btn--sm btn--ghost js-soon">Source Code</a>`;
  const fill = (sel, html) => {
    const el = $(sel);
    if (!el || !html) return;
    el.innerHTML = html;
    $$('[data-gh]', el).forEach(linkGh);
    $$('.reveal', el).forEach(n => revealObs.observe(n));
  };
  fetch('data/portfolio.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(d => {
      fill('.cards--skills', (d.skills || []).map(s => `<article class="skill glass reveal"><h3>${esc(s.name)}</h3><div class="bar" role="progressbar" aria-valuenow="${+s.level}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(s.name)}"><i style="--w:${+s.level}%"></i></div><span>${+s.level}%</span></article>`).join(''));
      fill('#projectGrid', (d.projects || []).map(p => `<article class="project glass" data-category="${esc(p.category)}"><div class="project__img ${esc(p.style)}" role="img" aria-label="${esc(p.title)} icon">${esc(p.icon)}</div><div class="project__body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><ul class="tags">${(p.tech || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul><div class="project__links">${linkBtn(p.demo, 'Live Demo', 'primary')}${srcBtn(p.source)}</div></div></article>`).join(''));
      fill('.cards--services', (d.services || []).map(s => `<article class="service glass reveal"><span class="service__ico" aria-hidden="true">${esc(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join(''));
    })
    .catch(() => {});

  /* Back to top + footer year */
  const toTop = $('#toTop');
  addEventListener('scroll', () => toTop.classList.toggle('is-shown', scrollY > 600), { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  $('#year').textContent = new Date().getFullYear();

  /* Contact form validation + sending
     The form posts to api/contact.php (works on InfinityFree, saves to api/messages.log).
     If that API isn't available (opened from disk, GitHub Pages), it falls back to
     opening the visitor's email app with the message filled in. */
  const FORM_ENDPOINT = 'api/contact.php';
  const CONTACT_EMAIL = 'Rommaldred2829@gmail.com';
  const form = $('#contactForm');
  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name (at least 2 characters).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email address, like name@example.com.',
    subject: v => v.trim().length >= 3 || 'Enter a subject (at least 3 characters).',
    message: v => v.trim().length >= 10 || 'Write a message of at least 10 characters.'
  };
  const check = input => {
    const res = rules[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('is-invalid', res !== true);
    $('.err', field).textContent = res === true ? '' : res;
    input.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  $$('input, textarea', form).forEach(i => {
    i.addEventListener('blur', () => check(i));
    i.addEventListener('input', () => i.closest('.field').classList.contains('is-invalid') && check(i));
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const inputs = $$('input, textarea', form);
    const valid = inputs.map(check).every(Boolean);
    if (!valid) { inputs.find(i => i.getAttribute('aria-invalid') === 'true').focus(); return; }
    const data = Object.fromEntries(inputs.map(i => [i.name, i.value.trim()]));

    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || 'Request failed');
      form.reset();
      notify('Message sent. Thanks, I will reply soon.');
    } catch {
      const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
      location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
      form.reset();
      notify('Opening your email app to send the message.');
    }
    btn.disabled = false;
  });
})();
