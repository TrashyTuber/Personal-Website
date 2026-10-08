export default function SiteFooter() {
  return (
    <footer className="px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono-game text-xs text-muted">
        <a href="mailto:jasonjiaym@gmail.com" className="hover:text-paper">
          email
        </a>
        <a
          href="https://github.com/TrashyTuber"
          target="_blank"
          rel="noopener"
          className="hover:text-paper"
        >
          github
        </a>
        <a
          href="https://www.linkedin.com/in/yiming-jia-0a10a9258/"
          target="_blank"
          rel="noopener"
          className="hover:text-paper"
        >
          linkedin
        </a>
        <span className="flex-1" />
        <span className="text-faint">
          © 2026 Yiming Jia <span lang="zh-Hans">贾一茗</span>
        </span>
      </div>
    </footer>
  );
}
