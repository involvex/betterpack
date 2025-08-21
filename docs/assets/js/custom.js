document.addEventListener("DOMContentLoaded", function() {
  var navLinks = {
    "Summary": "info",
    "Installation": "download",
    "Development": "code",
    "Support": "favorite",
    "View on GitHub": "code"
  };

  var links = document.querySelectorAll(".site-nav a");
  links.forEach(function(link) {
    var text = link.textContent.trim();
    if (navLinks[text]) {
      link.innerHTML = '<i class="material-icons">' + navLinks[text] + '</i> ' + text;
    }
  });
});
