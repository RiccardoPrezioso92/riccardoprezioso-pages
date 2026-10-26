document.documentElement.classList.add("js");

const currentPath = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll("[data-nav-link]").forEach((link) => {
  const linkPath = new URL(link.href, window.location.href).pathname.split("/").pop();

  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

const header = document.querySelector(".site-header");
const mobileNavigation = document.querySelector("[data-mobile-nav]");
const menuToggle = document.querySelector(".menu-toggle");
const menuToggleText = menuToggle?.querySelector("[data-menu-toggle-text]");
const mobileNavigationQuery = window.matchMedia("(max-width: 1080px)");

if (header && mobileNavigation && menuToggle) {
  const setMobileNavigationState = (isOpen, options = {}) => {
    const { focusMenu = false, restoreFocus = false } = options;
    const shouldOpen = mobileNavigationQuery.matches && isOpen;

    mobileNavigation.classList.toggle("is-open", shouldOpen);
    header.classList.toggle("has-open-menu", shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.setAttribute("aria-label", shouldOpen ? "Chiudi menu" : "Apri menu");

    if (menuToggleText) {
      menuToggleText.textContent = shouldOpen ? "Chiudi" : "Menu";
    }

    if (mobileNavigationQuery.matches) {
      mobileNavigation.setAttribute("aria-hidden", String(!shouldOpen));
    } else {
      mobileNavigation.removeAttribute("aria-hidden");
    }

    if (shouldOpen && focusMenu) {
      window.requestAnimationFrame(() => {
        mobileNavigation.querySelector("a")?.focus();
      });
    }

    if (!shouldOpen && restoreFocus) {
      menuToggle.focus();
    }
  };

  const closeMobileNavigation = (restoreFocus = false) => {
    setMobileNavigationState(false, { restoreFocus });
  };

  menuToggle.addEventListener("click", () => {
    const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    setMobileNavigationState(willOpen, { focusMenu: willOpen });
  });

  mobileNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMobileNavigation();
    }
  });

  document.addEventListener("click", (event) => {
    if (menuToggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) {
      closeMobileNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMobileNavigation(true);
    }
  });

  const syncMobileNavigation = () => closeMobileNavigation();

  if (typeof mobileNavigationQuery.addEventListener === "function") {
    mobileNavigationQuery.addEventListener("change", syncMobileNavigation);
  } else {
    mobileNavigationQuery.addListener(syncMobileNavigation);
  }

  syncMobileNavigation();
}

const heroPhoto = document.querySelector(".hero .photo-placeholder, .hero .profile-photo");
let frameRequested = false;

const updateScrollEffects = () => {
  const scrollY = window.scrollY;

  header?.classList.toggle("is-scrolled", scrollY > 20);

  if (heroPhoto && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const shift = Math.min(scrollY * 0.055, 22);
    heroPhoto.style.setProperty("--photo-shift", `${shift}px`);
  }

  frameRequested = false;
};

window.addEventListener("scroll", () => {
  if (!frameRequested) {
    window.requestAnimationFrame(updateScrollEffects);
    frameRequested = true;
  }
}, { passive: true });

updateScrollEffects();

const bookingPanel = document.querySelector("[data-booking-panel]");

if (bookingPanel) {
  const bookingTabs = [...bookingPanel.querySelectorAll("[data-location-tab]")];
  const calendarPanes = [...bookingPanel.querySelectorAll("[data-calendar-pane]")];
  const locationName = bookingPanel.querySelector("[data-location-name]");
  const locationAddress = bookingPanel.querySelector("[data-location-address]");
  const locationCity = bookingPanel.querySelector("[data-location-city]");
  const locationPhoto = bookingPanel.querySelector("[data-location-photo]");
  const locationPhotoImage = bookingPanel.querySelector("[data-location-photo-image]");
  const locationPhotoLabel = bookingPanel.querySelector("[data-location-photo-label]");

  const selectLocation = (tab) => {
    const controlledPaneId = tab.getAttribute("aria-controls");

    bookingTabs.forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-selected", String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });

    calendarPanes.forEach((pane) => {
      const isSelected = pane.id === controlledPaneId;
      pane.hidden = !isSelected;
      pane.classList.toggle("is-active", isSelected);
    });

    const name = tab.dataset.name;
    locationName.textContent = name;
    locationAddress.textContent = tab.dataset.address;
    locationCity.textContent = tab.dataset.city;

    const imageSrc = tab.dataset.image;

    if (imageSrc) {
      locationPhotoImage.src = imageSrc;
      locationPhotoImage.alt = tab.dataset.imageAlt || `Interni di ${name}`;
      locationPhotoImage.hidden = false;
      locationPhotoLabel.hidden = true;
      locationPhoto.classList.add("has-image");
      locationPhoto.removeAttribute("role");
      locationPhoto.removeAttribute("aria-label");
    } else {
      locationPhotoImage.hidden = true;
      locationPhotoImage.alt = "";
      locationPhotoLabel.textContent = `Foto centro · ${name}`;
      locationPhotoLabel.hidden = false;
      locationPhoto.classList.remove("has-image");
      locationPhoto.setAttribute("role", "img");
      locationPhoto.setAttribute("aria-label", `Placeholder fotografia di ${name}`);
    }
  };

  bookingTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectLocation(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      let nextIndex = index;

      if (event.key === "ArrowLeft") nextIndex = (index - 1 + bookingTabs.length) % bookingTabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % bookingTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = bookingTabs.length - 1;

      bookingTabs[nextIndex].focus();
      selectLocation(bookingTabs[nextIndex]);
    });
  });

  const requestedLocation = new URLSearchParams(window.location.search).get("sede");
  const requestedTab = bookingTabs.find((tab) => tab.dataset.locationSlug === requestedLocation);

  selectLocation(requestedTab || bookingTabs.find((tab) => tab.getAttribute("aria-selected") === "true") || bookingTabs[0]);
}

const qrCards = document.querySelectorAll("[data-qr-card]");

const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    let finalLine = visibleLines[maxLines - 1];

    while (context.measureText(`${finalLine}…`).width > maxWidth && finalLine.includes(" ")) {
      finalLine = finalLine.slice(0, finalLine.lastIndexOf(" "));
    }

    visibleLines[maxLines - 1] = `${finalLine}…`;
  }

  visibleLines.forEach((visibleLine, index) => context.fillText(visibleLine, x, y + (index * lineHeight)));
  return y + (visibleLines.length * lineHeight);
};

const createQrCardCanvas = async (card) => {
  const canvas = document.createElement("canvas");
  canvas.width = 2200;
  canvas.height = 440;
  const context = canvas.getContext("2d");
  const qrImage = new Image();
  qrImage.decoding = "async";
  qrImage.src = new URL(card.dataset.qrImage, window.location.href).href;
  await qrImage.decode();

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#000000";
  context.lineWidth = 5;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  const textX = 64;
  const textWidth = 1660;
  context.fillStyle = "#000000";
  context.font = "600 25px Arial, Helvetica, sans-serif";
  context.fillText("DOTT. RICCARDO PREZIOSO · FISIATRA INTERVENTISTA", textX, 48);

  context.font = "700 54px Arial, Helvetica, sans-serif";
  let nextY = drawWrappedText(context, card.dataset.qrTitle, textX, 112, textWidth, 61, 2);

  context.font = "400 30px Arial, Helvetica, sans-serif";
  nextY = drawWrappedText(context, card.dataset.qrSubtitle, textX, nextY + 8, textWidth, 39, 2);

  context.font = "700 27px Arial, Helvetica, sans-serif";
  drawWrappedText(context, card.dataset.qrCta, textX, Math.max(nextY + 18, 292), textWidth, 35, 2);

  context.font = "400 19px Arial, Helvetica, sans-serif";
  context.fillText(card.dataset.qrUrl.replace("https://www.", ""), textX, 408);

  const qrSize = 340;
  context.imageSmoothingEnabled = false;
  context.drawImage(qrImage, canvas.width - qrSize - 48, 50, qrSize, qrSize);

  return canvas;
};

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Impossibile generare l’immagine."));
  }, "image/png");
});

qrCards.forEach((card) => {
  const copyButton = card.querySelector("[data-copy-qr]");
  const downloadButton = card.querySelector("[data-download-qr]");
  const status = card.querySelector("[data-qr-status]");
  let canvasPromise;

  const getCanvas = () => {
    canvasPromise ||= createQrCardCanvas(card);
    return canvasPromise;
  };

  copyButton?.addEventListener("click", async () => {
    copyButton.disabled = true;
    status.textContent = "Preparo il riquadro…";

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("La copia delle immagini non è supportata da questo browser.");
      }

      const canvas = await getCanvas();
      const imageBlob = await canvasToBlob(canvas);
      const plainText = `${card.dataset.qrTitle}\n${card.dataset.qrSubtitle}\n${card.dataset.qrCta}\n${card.dataset.qrUrl}`;

      try {
        await navigator.clipboard.write([new ClipboardItem({
          "image/png": imageBlob,
          "text/plain": new Blob([plainText], { type: "text/plain" })
        })]);
      } catch (multiFormatError) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
      }

      status.textContent = "Riquadro copiato. Puoi incollarlo nel referto.";
    } catch (error) {
      status.textContent = "Copia non disponibile: usa “Scarica PNG”.";
    } finally {
      copyButton.disabled = false;
    }
  });

  downloadButton?.addEventListener("click", async () => {
    downloadButton.disabled = true;
    status.textContent = "Preparo il file…";

    try {
      const canvas = await getCanvas();
      const link = document.createElement("a");
      const slug = new URL(card.dataset.qrUrl).pathname.split("/").pop().replace(".html", "");
      link.download = `approfondimento-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      status.textContent = "PNG scaricato.";
    } catch (error) {
      status.textContent = "Non è stato possibile generare il file.";
    } finally {
      downloadButton.disabled = false;
    }
  });
});

const revealTargets = document.querySelectorAll([
  ".hero-copy > *",
  ".hero-grid > .photo-placeholder",
  ".hero-grid > .profile-photo",
  ".page-hero .container > *",
  ".trust-item",
  ".section-heading > *",
  ".service-overview-item",
  ".split > *",
  ".method-flow p",
  ".location-card",
  ".review-panel > *",
  ".service-detail",
  ".visit-narrative section",
  ".article-index-item",
  ".professional-layout > *",
  ".qr-copy-panel > *",
  ".article-aside > *",
  ".article-copy > h2",
  ".article-copy > .article-deck",
  ".district-index a",
  ".district-intro > *",
  ".pathology-list details",
  ".pathology-preview-link",
  ".cta-inner > *"
].join(","));

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
});

const sections = document.querySelectorAll(".section");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  revealTargets.forEach((element) => revealObserver.observe(element));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-in-view", entry.isIntersecting);
    });
  }, { rootMargin: "-15% 0px -15% 0px", threshold: 0.05 });

  sections.forEach((section) => sectionObserver.observe(section));
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
  sections.forEach((section) => section.classList.add("is-in-view"));
}

