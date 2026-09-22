from playwright.sync_api import sync_playwright
import time

BASE = "https://ppp-content-studio.preview.emergentagent.com"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1680, "height": 900})
    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.fill('[data-testid="login-email"]', 'alex@practicalpokerplus.com')
    pg.fill('[data-testid="login-password"]', 'coach1234')
    pg.click('[data-testid="login-submit"]')
    pg.wait_for_selector('[data-testid="nav-replayer"]', timeout=15000)
    time.sleep(1.2)
    # open first deck
    pg.click('[data-testid^="deck-card-"]')
    pg.wait_for_selector('[data-testid="slide-preview"]', timeout=15000)
    time.sleep(1.5)
    pg.screenshot(path="/app/shots/studio_title.png")
    print("studio_title")
    # click a stats slide thumb if any -> click layout switch to stats to demo
    pg.click('[data-testid="thumb-4"]'); time.sleep(0.8)
    pg.screenshot(path="/app/shots/studio_stats.png")
    print("studio_stats")
    # two_column layout on current
    pg.click('[data-testid="thumb-6"]'); time.sleep(0.8)
    pg.screenshot(path="/app/shots/studio_twocol.png")
    print("studio_twocol")
    b.close()
    print("DONE")
