// Welcome page, opened once when the extension is first installed.
(function () {
  self.SD.i18n.applyToDocument(document);
  try { document.documentElement.lang = chrome.i18n.getUILanguage().split('-')[0]; } catch (e) { /* keep "en" */ }
  document.getElementById('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
})();
