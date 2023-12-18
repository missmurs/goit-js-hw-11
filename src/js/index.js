import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { NewsApiServer } from './pixabay-api';
import { createMarkup } from './markup';

const searchForm = document.querySelector('.search-form');
const galleryContainer = document.querySelector('.gallery');
const btnLoadMore = document.querySelector('.load-more');
const loader = document.querySelector('.loader');

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const newsApiServer = new NewsApiServer();

loader.classList.add('hidden');

searchForm.addEventListener('submit', onSubmitForm);
btnLoadMore.addEventListener('click', onLoadMore);

function onSubmitForm(evt) {
  evt.preventDefault();

  clearPage();

  const searchQuery = evt.currentTarget.elements.searchQuery.value.trim();
  if (!searchQuery) {
    return Notiflix.Notify.info('Please fill in the search field.');
  }

  newsApiServer.searchQuery = searchQuery.toLowerCase().split(' ').join('+');
  fetchAndRender();
}

async function fetchAndRender() {
  try {
    const data = await newsApiServer.fetchImages();

    if (data.totalHits === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else {
      Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);

      appendPhotoMarkup(data);
      pageScrolling();
      lightbox.refresh();

      if (data.totalHits <= newsApiServer.totalImgs) {
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
        window.removeEventListener('scroll', infinityScroll);
      } else {
        window.addEventListener('scroll', infinityScroll);
      }
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    loader.classList.add('hidden');
  }
}

function onLoadMore() {
  fetchAndRender();
}

function appendPhotoMarkup(data) {
  galleryContainer.insertAdjacentHTML('beforeend', createMarkup(data.hits));
  newsApiServer.totalImgs += data.hits.length;
}

function clearPage() {
  galleryContainer.innerHTML = '';
  newsApiServer.resetPage();
  newsApiServer.totalImgs = 0;
}

function pageScrolling() {
  const cardHeight = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect().height;

  window.scrollBy({
    top: cardHeight * 1.5,
    behavior: 'smooth',
  });
}

function infinityScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 1) {
    onLoadMore();
  }
}
