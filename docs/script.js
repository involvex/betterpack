// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Add active state to navigation based on scroll position
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll("section[id]")
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]')

  let current = ""
  sections.forEach((section) => {
    const sectionTop = section.offsetTop
    const sectionHeight = section.clientHeight
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id")
    }
  })

  navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active")
    }
  })
})

// Copy code blocks to clipboard
document.querySelectorAll("pre code").forEach((block) => {
  const button = document.createElement("button")
  button.className = "copy-button"
  button.textContent = "Copy"
  button.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
    `

  const pre = block.parentElement
  pre.style.position = "relative"
  pre.appendChild(button)

  pre.addEventListener("mouseenter", () => {
    button.style.opacity = "1"
  })

  pre.addEventListener("mouseleave", () => {
    button.style.opacity = "0"
  })

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(block.textContent)
      button.textContent = "Copied!"
      setTimeout(() => {
        button.textContent = "Copy"
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  })
})
