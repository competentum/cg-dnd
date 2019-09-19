var liveRegion = document.getElementById('live-region');

function setLiveText(text, mode) {
  var DEFAULT_MODE = 'polite',
      liveRegionMode = mode || DEFAULT_MODE,
      currentRegionMode = liveRegion.getAttribute('aria-live');

  if (liveRegionMode !== currentRegionMode) {
    liveRegion.setAttribute('aria-live', liveRegionMode);
  }

  liveRegion.innerHTML = '';
  liveRegion.innerHTML = text;
}