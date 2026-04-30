(function () {
  function hideFlags() {
    // 1. Hide SVG flags in dropdown menu items
    document
      .querySelectorAll("#localization-select-item svg")
      .forEach((el) => {
        el.style.display = "none";
      });

    // 2. Hide flag in trigger button
    const trigger = document.querySelector("#localization-select-trigger");
    if (!trigger) return;

    // Trigger DOM typically: [flag_wrapper] [text_wrapper] [chevron_svg]
    // Hide all SVGs except the last one (chevron)
    const allSvgs = Array.from(trigger.querySelectorAll("svg"));
    if (allSvgs.length > 1) {
      // More than one SVG -> hide all but last (chevron)
      allSvgs.slice(0, -1).forEach((svg) => {
        svg.style.display = "none";
      });
    }
    // If only one SVG, it might be the chevron in some themes — leave it

    // Hide any flag images
    trigger.querySelectorAll("img").forEach((img) => {
      img.style.display = "none";
    });

    // Try to hide emoji flags (regional indicator symbols like 🇨🇳 🇺🇸)
    const walker = document.createTreeWalker(
      trigger,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    let node;
    while ((node = walker.nextNode())) {
      // Remove flag emojis: two consecutive regional indicator symbols
      if (/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/.test(node.textContent)) {
        node.textContent = node.textContent.replace(
          /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g,
          ""
        );
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideFlags);
  } else {
    hideFlags();
  }

  // Re-run when dropdown opens (DOM mutations)
  const observer = new MutationObserver(hideFlags);
  observer.observe(document.body, { childList: true, subtree: true });
})();
