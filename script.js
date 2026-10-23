const defaultData = {
  name: 'Eng. Marwan Wagih',
  title: 'Engineer • Consultant • Problem Solver',
  about: 'Delivering practical engineering solutions with a focus on quality, reliability, and successful project execution.',
  phone: '01221219132',
  whatsapp: '01221219132',
  linkedin: 'https://www.linkedin.com/in/marwanwagih',
  instagram: 'https://www.instagram.com/marwan__wagih',
  facebook: 'https://www.facebook.com/share/19i6qM7xoE/',
  github: 'https://github.com/marwanwagih',
  photo: ''
};

const state = { ...defaultData };

function applyState() {
  document.getElementById('portfolioName').textContent = state.name;
  document.getElementById('eyebrowText').textContent = state.title;
  document.getElementById('aboutText').textContent = state.about;
  document.getElementById('aboutTextBlock').textContent = state.about;
  document.getElementById('footerName').textContent = state.name;

  const handle = state.instagram
    .replace('https://www.instagram.com/', '')
    .replace(/\/+$/, '')
    .replace(/\//g, '') || 'MARWAN__WAGIH';
  const instagramHandle = document.getElementById('instagramHandle');
  if (instagramHandle) {
    instagramHandle.textContent = '@' + handle;
  }

  document.getElementById('phoneLink').href = `tel:${state.phone}`;
  document.getElementById('whatsappLink').href = `https://wa.me/${state.whatsapp.replace(/\D/g, '')}`;

  document.getElementById('linkedinLink').href = state.linkedin;
  document.getElementById('instagramLink').href = state.instagram;
  document.getElementById('facebookLink').href = state.facebook;
  document.getElementById('githubLink').href = state.github;

  const avatar = document.getElementById('profileAvatar');
  if (state.photo) {
    avatar.textContent = '';
    avatar.style.backgroundImage = `url('${state.photo}')`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
  } else {
    avatar.textContent = state.name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatar.style.backgroundImage = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  applyState();

  const revealItems = document.querySelectorAll('.reveal');
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    )
    : null;

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${(index % 4) * 90}ms`);
    const bounds = item.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      item.classList.add('visible');
    } else if (observer) {
      observer.observe(item);
    } else {
      item.classList.add('visible');
    }
  });
  document.documentElement.classList.add('reveal-ready');

  const parallaxElements = document.querySelectorAll('.bg-orb');

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const x = (event.clientX / window.innerWidth - 0.5) * 32;
    const y = (event.clientY / window.innerHeight - 0.5) * 32;

    parallaxElements.forEach((el, index) => {
      const depth = index === 0 ? 0.7 : -0.45;
      el.style.translate = `${x * depth}px ${y * depth}px`;
    });
  });

});
