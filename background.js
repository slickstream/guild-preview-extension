let serverUrl = '';

async function getSiteData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['siteData', 'server'], (result) => {
      const siteData = result.siteData;
      serverUrl = result.server || 'https://poweredbyslick.com//e1/embed-nav.js';
      resolve(siteData || {});
    });
  });
}

function inject(options) {
  const css = "`" + (options.css || '').replace('\n', '') + "`";
  const code = `
    ((siteCode, css, selector, stripSelector, scriptUrl, stripPosition, explorerPosition) => {
      stripPosition = stripPosition || 'after selector';
      explorerPosition = explorerPosition || 'after selector';
      if (!window.slick) {
        window.slick = { site: siteCode };
        if (selector) {
          window.slick.explorer = {
            position: explorerPosition,
            selector: selector
          };
        }
        if (stripSelector) {
          window.slick.filmStrip = {
            position: stripPosition,
            selector: stripSelector
          };
        }
        localStorage.setItem('slick-nav-extension-config', JSON.stringify(window.slick));
        if (css) {
          const styleNode = document.createElement('style');
          styleNode.innerHTML = css;
          document.body.appendChild(styleNode);
        }
        const s = document.createElement('script');
        s.src = scriptUrl;
        document.head.appendChild(s);
      }
    })('${options.siteCode}', ${css}, '${options.selector}', '${options.stripSelector}', '${serverUrl}', '${options.stripPosition}', '${options.explorerPosition}');
  `;
  console.log(code);
  chrome.tabs.executeScript({ code });
}

chrome.webNavigation.onDOMContentLoaded.addListener(async (data) => {
  if (!data.frameId) {
    const host = new URL(data.url).host;
    const siteData = await getSiteData();
    if (siteData[host] && siteData[host].siteCode) {
      inject(siteData[host])
    }
  }
});