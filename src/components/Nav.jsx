export default function Nav({ go, open, setOpen, account, readerKind, onLogout }) {
  return (
    <header className="site-header">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="wrap nav-row">
        <a className="brand" href="https://hereducation.org">
          <span className="logo-mark" aria-hidden="true">
            <img src="/her-logo.jpg" alt="" />
          </span>
          <span className="brand-name">
            <strong>Her Education</strong>
            <em>Required</em>
          </span>
        </a>
        {account ? (
          <>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((value) => !value)}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <i />
              <i />
              <i />
            </button>
            <nav id="site-nav" className={`nav-links ${open ? "is-open" : ""}`}>
              {readerKind ? (
                <button type="button" className="btn-text" onClick={() => go("#read")}>
                  Read applications
                </button>
              ) : null}
              <button type="button" className="btn-text" onClick={onLogout}>
                Log out
              </button>
            </nav>
          </>
        ) : null}
      </div>
    </header>
  );
}
