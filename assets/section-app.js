(function () {
  var repairedHash = window.location.hash.replace(/^#\/guides\/(?:guides\/)+/, '#/guides/');
  if (repairedHash !== window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + repairedHash);
  }
  var config = window.RocketXSection || {};
  var searchIndexPromise;
  var diagramLibrary;
  var orderMenuOpen;
  var lastMenuRoute;

  function refreshOrderMenu() {
    var link = Array.from(document.querySelectorAll('.sidebar-nav a')).find(function (a) {
      return a.hash.replace(/\.md$/, '') === '#/guides/order';
    });
    if (!link) return;
    var item = link.parentElement;
    var list = item.querySelector('ul');
    if (!list) return;
    var route = currentRoute().replace(/\.md$/, '');
    if (route !== lastMenuRoute && route.indexOf('#/guides/order') === 0) orderMenuOpen = true;
    lastMenuRoute = route;
    item.classList.add('order-menu');
    list.id = 'order-submenu';
    var toggle = item.querySelector('.order-menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'order-menu-toggle';
      toggle.setAttribute('aria-label', 'Toggle Order sections');
      toggle.setAttribute('aria-controls', list.id);
      toggle.title = 'Toggle Order sections';
      toggle.textContent = '\u203a';
      item.insertBefore(toggle, list);
      toggle.addEventListener('click', function () {
        orderMenuOpen = !orderMenuOpen;
        list.hidden = !orderMenuOpen;
        toggle.setAttribute('aria-expanded', String(!!orderMenuOpen));
      });
    }
    list.hidden = !orderMenuOpen;
    toggle.setAttribute('aria-expanded', String(!!orderMenuOpen));
  }

  function renderDiagrams() {
    var codeBlocks = document.querySelectorAll('pre > code.lang-mermaid, pre > code.language-mermaid');
    if (!codeBlocks.length) return;
    if (!diagramLibrary) {
      diagramLibrary = import('https://cdn.jsdelivr.net/npm/mermaid@11.10.1/dist/mermaid.esm.min.mjs').then(function (module) {
        module.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'Arial', sequence: { useMaxWidth: false, wrap: true, actorMargin: 35, width: 120 } });
        return module.default;
      });
    }
    diagramLibrary.then(function (mermaid) {
      var nodes = [];
      codeBlocks.forEach(function (code) {
        if (!code.isConnected) return;
        var figure = document.createElement('div');
        figure.className = 'flow-diagram';
        figure.setAttribute('role', 'img');
        figure.setAttribute('aria-label', 'Integration sequence diagram');
        var graph = document.createElement('div');
        graph.className = 'mermaid';
        graph.textContent = code.textContent;
        figure.appendChild(graph);
        code.parentElement.replaceWith(figure);
        nodes.push(graph);
      });
      return mermaid.run({ nodes: nodes });
    }).catch(function (error) { console.error('Diagram rendering failed', error); });
  }

  function currentRoute() {
    return (window.location.hash || "#/").split("?")[0];
  }

  function refreshTitle() {
    var route = currentRoute().replace(/\.md$/, "");
    var page = (config.pages || []).find(function (item) {
      return item.hash === route;
    });

    document.title = (page ? page.title + " | " : "") + (config.name || "RocketX API");
    document.querySelectorAll('.sidebar-nav a').forEach(function (link) {
      var active = link.hash.split('?')[0].replace(/\.md$/, '') === route;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function refreshPageNavigation() {
    var content = document.querySelector('.markdown-section');
    if (!content) return;
    content.querySelectorAll('.page-breadcrumbs, .page-pagination').forEach(function (node) { node.remove(); });
    var pages = config.pages || [];
    var route = currentRoute().replace(/\.md$/, '');
    var index = pages.findIndex(function (page) { return page.hash === route; });
    if (index < 0) return;

    var breadcrumbs = document.createElement('nav');
    breadcrumbs.className = 'page-breadcrumbs';
    breadcrumbs.setAttribute('aria-label', 'Breadcrumb');
    var home = document.createElement(index === 0 ? 'span' : 'a');
    home.textContent = config.label;
    if (index > 0) home.href = pages[0].hash;
    else home.setAttribute('aria-current', 'page');
    breadcrumbs.appendChild(home);
    if (index > 0) {
      var separator = document.createElement('span');
      separator.textContent = '/';
      separator.setAttribute('aria-hidden', 'true');
      breadcrumbs.appendChild(separator);
      if (pages[index].parent) {
        var parent = pages.find(function (page) { return page.hash === pages[index].parent; });
        if (parent) {
          var parentLink = document.createElement('a');
          parentLink.href = parent.hash;
          parentLink.textContent = parent.title;
          breadcrumbs.appendChild(parentLink);
          breadcrumbs.appendChild(separator.cloneNode(true));
        }
      }
      var current = document.createElement('span');
      current.textContent = pages[index].title;
      current.setAttribute('aria-current', 'page');
      breadcrumbs.appendChild(current);
    }
    content.prepend(breadcrumbs);

    var pagination = document.createElement('nav');
    pagination.className = 'page-pagination';
    pagination.setAttribute('aria-label', 'Page navigation');
    [-1, 1].forEach(function (offset) {
      var page = pages[index + offset];
      if (!page) return;
      var link = document.createElement('a');
      link.className = offset < 0 ? 'page-previous' : 'page-next';
      link.href = page.hash;
      var label = document.createElement('span');
      label.textContent = offset < 0 ? 'Previous' : 'Next';
      var title = document.createElement('span');
      title.textContent = page.title;
      link.appendChild(label);
      link.appendChild(title);
      pagination.appendChild(link);
    });
    content.appendChild(pagination);
  }

  function refreshOutline() {
    var outline = document.getElementById("page-outline-links");
    var container = document.querySelector(".page-outline");
    var content = document.querySelector(".markdown-section");

    if (!outline || !container || !content) {
      return;
    }

    var headings = Array.prototype.slice.call(content.querySelectorAll("h2, h3"))
      .filter(function (heading) {
        return heading.id && heading.textContent.trim();
      });

    outline.innerHTML = "";
    container.classList.toggle("is-empty", headings.length === 0);

    headings.slice(0, 10).forEach(function (heading) {
      var link = document.createElement("a");
      link.href = currentRoute() + "?id=" + encodeURIComponent(heading.id);
      link.textContent = heading.textContent.replace(/\u200B/g, "").trim();
      link.dataset.level = heading.tagName === "H3" ? "3" : "2";
      outline.appendChild(link);
    });
  }

  function buildSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = Promise.all((config.pages || []).map(function (page) {
        return fetch(page.file)
          .then(function (response) {
            return response.ok ? response.text() : "";
          })
          .then(function (content) {
            return Object.assign({}, page, { content: content.toLowerCase() });
          })
          .catch(function () {
            return Object.assign({}, page, { content: "" });
          });
      }));
    }

    return searchIndexPromise;
  }

  function setupSearch() {
    var input = document.getElementById("doc-search-input");
    var output = document.getElementById("doc-search-results");

    if (!input || !output) {
      return;
    }

    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();

      if (!query) {
        output.hidden = true;
        output.innerHTML = "";
        return;
      }

      buildSearchIndex().then(function (pages) {
        var results = pages.filter(function (page) {
          return page.title.toLowerCase().indexOf(query) !== -1 || page.content.indexOf(query) !== -1;
        });

        output.innerHTML = "";
        results.slice(0, 8).forEach(function (page) {
          var link = document.createElement("a");
          link.className = "search-result";
          link.href = page.hash;
          link.innerHTML = "<span class=\"search-result-title\"></span><span class=\"search-result-section\"></span>";
          link.querySelector(".search-result-title").textContent = page.title;
          link.querySelector(".search-result-section").textContent = config.label;
          output.appendChild(link);
        });

        if (!results.length) {
          var empty = document.createElement("div");
          empty.className = "search-result";
          empty.textContent = "No results found";
          output.appendChild(empty);
        }

        output.hidden = false;
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".doc-search")) {
        output.hidden = true;
      }
    });
  }

  window.RocketXSectionShell = {
    refresh: function () {
      window.setTimeout(function () {
        refreshTitle();
        refreshOrderMenu();
        refreshPageNavigation();
        refreshOutline();
        renderDiagrams();
      }, 0);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.createElement('button');
    toggle.className = 'section-menu-toggle';
    toggle.type = 'button';
    toggle.textContent = '\u2630';
    toggle.title = 'Navigation';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    document.querySelector('.header-main').appendChild(toggle);
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('section-menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('.sidebar a')) {
        document.body.classList.remove('section-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    setupSearch();
    refreshTitle();
  });

  window.addEventListener("hashchange", refreshTitle);
})();
