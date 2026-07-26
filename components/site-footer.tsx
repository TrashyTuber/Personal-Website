export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline px-6 py-8 md:pl-[112px]">
      <div className="flex flex-wrap items-baseline gap-6 font-mono-game text-sm text-muted">
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
