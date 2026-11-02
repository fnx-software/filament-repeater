from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
html = (root / 'examples/demo.html').read_text()
css = (root / 'resources/css/fnx-repeater.css').read_text()
module_data = base64.b64encode((root / 'dist/fnx-repeater.js').read_bytes()).decode()
html = html.replace('<link rel="stylesheet" href="../resources/css/fnx-repeater.css">', '<style>' + css + '</style>')
html = html.replace("from '../dist/fnx-repeater.js';", "from 'data:text/javascript;base64," + module_data + "';")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html)
    page.wait_for_selector('.fnx-r-item')
    assert page.locator('.fnx-r-item').count() == 2
    assert page.locator('#statsNetwork').inner_text() == '0'
    page.locator('.fnx-r-add').click()
    assert page.locator('.fnx-r-item').count() == 3
    product = page.locator('.fnx-r-item:first-child input[type=text]')
    product.fill('Updated item')
    assert page.evaluate('window.__fnxDemo.getRows()[0].product') == 'Updated item'
    assert product.evaluate('(input) => document.activeElement === input')
    page.locator('.fnx-r-item:first-child input[type=number]').first.fill('7')
    assert page.evaluate('window.__fnxDemo.getRows()[0].quantity') == 7
    page.locator('.fnx-r-item:first-child button[aria-label="Duplicate"]').click()
    assert page.locator('.fnx-r-item').count() == 4
    page.locator('.fnx-r-item:first-child button[aria-label="Delete"]').click()
    assert page.locator('.fnx-r-item').count() == 3
    page.get_by_role('button', name='Undo delete').click()
    assert page.locator('.fnx-r-item').count() == 4
    page.locator('.fnx-r-item:first-child button[aria-label="Collapse"]').click()
    assert page.locator('.fnx-r-item:first-child .fnx-r-item-body').count() == 0
    page.locator('.fnx-r-item:first-child button[aria-label="Expand"]').click()
    assert page.locator('.fnx-r-item:first-child .fnx-r-item-body').count() == 1
    page.locator('#seed1000').click()
    assert page.locator('#statsRows').inner_text() == '1000'
    assert page.locator('.fnx-r-item').count() == 25
    assert page.locator('#statsNetwork').inner_text() == '0'
    page.locator('.fnx-r-item:first-child button[aria-label="Move down"]').click()
    assert page.evaluate('window.__fnxDemo.getRows()[0].product') == 'Item 2'
    page.locator('#rtl').click()
    assert page.locator('html').get_attribute('dir') == 'rtl'
    assert page.locator('.fnx-r-add').inner_text() == 'إضافة عنصر'
    page.locator('#theme').click()
    assert page.locator('body.dark').count() == 1
    page.locator('#save').click()
    assert page.locator('#statsNetwork').inner_text() == '1'
    assert not errors, errors
    page.screenshot(path=str(root / 'examples/screenshot-desktop.png'), full_page=True)
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile.set_content(html)
    mobile.wait_for_selector('.fnx-r-item')
    assert mobile.locator('.fnx-r-grid').first.evaluate('(el) => getComputedStyle(el).gridTemplateColumns.split(" ").length === 1')
    mobile.screenshot(path=str(root / 'examples/screenshot-mobile.png'), full_page=True)
    print('PASS desktop/mobile: 1,000 items, 25 DOM cards, no JS errors')
    browser.close()
