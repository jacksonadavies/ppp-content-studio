from playwright.sync_api import sync_playwright
import time

BASE = "https://ppp-content-studio.preview.emergentagent.com"

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1680, "height": 900})

    def shot(name):
        pg.screenshot(path=f"/app/shots/{name}.png")
        print("shot", name)

    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.fill('[data-testid="login-email"]', 'alex@practicalpokerplus.com')
    pg.fill('[data-testid="login-password"]', 'coach1234')
    pg.click('[data-testid="login-submit"]')
    pg.wait_for_selector('[data-testid="nav-replayer"]', timeout=15000)
    time.sleep(1.5)
    shot("dashboard")

    # Replayer
    pg.goto(f"{BASE}/replayer", wait_until="networkidle")
    time.sleep(2)
    pg.click('[data-testid="pcards-0"]'); time.sleep(0.5)
    pg.click('[data-testid="pick-As"]'); pg.click('[data-testid="pick-Ah"]')
    pg.click('[data-testid="cardpicker-confirm"]'); time.sleep(0.4)
    pg.click('[data-testid="tab-board"]'); time.sleep(0.3)
    pg.click('[data-testid="board-picker"]'); time.sleep(0.4)
    for c in ["Ac", "Kd", "7s"]:
        pg.click(f'[data-testid="pick-{c}"]')
    pg.click('[data-testid="cardpicker-confirm"]'); time.sleep(0.5)
    # actions
    pg.click('[data-testid="tab-actions"]'); time.sleep(0.3)
    pg.click('[data-testid="deal-flop"]'); time.sleep(0.4)
    shot("replayer")

    b.close()
    print("DONE")
