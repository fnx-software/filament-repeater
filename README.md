# FNXRepeater

**Experimental browser-first repeater field for Filament 5.11+.** Maintained by `fnx-software`.

FNXRepeater mimics the standard Filament Repeater **card appearance** and the most common item interactions, while rendering **only the visible page of items** in JavaScript. Add, delete, duplicate, reorder, collapse, expand, and edit happen in the browser; `props.onChange()` updates deferred Livewire state and the surrounding form is saved by Laravel.

> [!IMPORTANT]
> **This beta is not a drop-in replacement for every native `Repeater` feature.** There is no general way to execute arbitrary Filament PHP field schemas, relationship callbacks, policies, action closures, upload handlers, or dependent field options purely in the browser. Instead of silently corrupting data, unsupported field types are rejected.
>
> Do not use in production until you have run real Filament/Livewire integration and persistence tests in your application.

## Screenshots

[Open the standalone playground](examples/demo.html)

## Requirements

- PHP 8.2+
- Filament Forms 5.11+
- Livewire and Laravel versions compatible with the installed Filament release

## Install from this GitHub repo

```bash
composer config repositories.fnx-repeater vcs https://github.com/fnx-software/filament-repeater.git
composer require 'fnx-software/filament-repeater:dev-main' -W
php artisan filament:assets
php artisan optimize:clear
```

For a non-default development branch, use that branch in place of `dev-main` (e.g. `dev-feat/fnx-repeater-browser-first`). A tagged release and Packagist publication will come **after** integration tests.

The package is auto-discovered through Laravel; no Panel Plugin registration is needed.

## Example: use familiar Filament fields

```php
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use FnxSoftware\FNXRepeater\Forms\Components\FNXRepeater;

FNXRepeater::make('items')
    ->label('Invoice items')
    ->schema([
        TextInput::make('description')->label('Description')->required(),
        TextInput::make('quantity')->numeric()->default(1)->minValue(1),
        TextInput::make('price')->numeric()->default(0)->minValue(0),
        Select::make('type')->options(['service' => 'Service', 'product' => 'Product']),
        Checkbox::make('taxable')->default(true),
    ])
    ->gridColumns(2)
    ->itemLabelColumn('description')
    ->collapsible()
    ->cloneable()
    ->reorderableWithButtons()
    ->pageSize(25)
    ->maxItems(1000)
    ->columnSpanFull();
```

Only *static options* in `Select::options()` are supported. The supported native fields are `TextInput` (plain/number/email), `Textarea`, `Select` (static, single), `Checkbox`, and `Toggle`. Static defaults, basic labels, required, min/max number input, readonly and max text length are mapped; **the full native PHP validation/hook API is not automatically transferred**, so server rules need separate review.

You can also use `FNXColumn` for explicit browser-safe configuration:

```php
use FnxSoftware\FNXRepeater\Forms\Components\FNXColumn;

FNXRepeater::make('details')->schema([
    FNXColumn::make('title')->label('Title')->required(),
    FNXColumn::make('quantity')->label('Quantity')->number()->min(1)->default(1),
]);
```

## Persistence: JSON column

```php
// Migration
$table->json('items')->nullable();

// Eloquent model
protected function casts(): array
{
    return ['items' => 'array'];
}
```

Use a normal Filament Resource Create/Edit form. **Do not** call `->relationship()` on this beta: native `Repeater::relationship()` depends on server-side child schemas and Eloquent lifecycle semantics not implemented here.

## Features and trade-offs

| Feature | Beta |
| --- | --- |
| Native-inspired card UI; RTL and dark mode | Yes, visually similar, not pixel-identical |
| Add, delete, duplicate, undo | Browser |
| Drag-and-drop reorder and up/down buttons | Browser |
| Collapse/expand/all | Browser |
| Item number/title from a field | Browser |
| `minItems` / `maxItems`, `defaultItems`, `addActionLabel` | Yes |
| Pagination (25 cards per visible page) | Yes |
| Submit with standard Filament form state | Yes, intended; actual Laravel integration not yet verified |
| Relationship HasMany persistence | **No** |
| All native Filament field types | **No** |
| Nested Repeaters, custom actions, file uploads | **No** |
| Searchable/relationship Select, PHP callback-dependent visibility | **No** |
| Custom validation hooks / cross-field PHP rules | **No** |
| True virtualization and per-row server validation messages | **No** |

**Performance semantics:** Interaction uses no fetch requests in the standalone playground. Livewire `props.onChange()` keeps an entire JSON array synchronized with browser state; other Livewire requests can transmit it, and `->live()` explicitly requests reactive server updates. Large arrays still increase payload and save-time validation cost. Pages limit **DOM nodes**, not array size.

**Security semantics:** All state is untrusted. The PHP validation rule enforces allowed keys, types, numeric ranges, fixed select options and row count. Application-level policies, foreign key ownership, prices, totals and tenant checks must be applied on the server. Read-only/disabled controls are never authorization barriers.

## Try the browser playground

From the package root:

```bash
python3 -m http.server 8000
# http://localhost:8000/examples/demo.html
```

The demo uses the same JS renderer and bundled CSS and can generate 1,000 items; its Save button is **mock only**.

## Testing

```bash
npm test
php -d zend.assertions=1 tests/php/column-smoke.php
python3 tests/js/browser_e2e.py  # Python Playwright + Chromium required
find src lang -name '*.php' -exec php -l '{}' ';'
```

Browser test coverage includes 1,000 items with 25 DOM cards, edit focus retention, local mutations, collapse, RTL, and mobile layout. Full Composer integration, Livewire save, Eloquent relationship handling and real-world load testing remain to be verified.

## Architectural decision

This package is a **standalone Filament Field**, not a subclass of the native `Repeater`: the native component constructs one PHP `Schema` for every item, so inheritance would retain much of the server cost. Arbitrary PHP closures cannot be serialized into safe executable client code.

Future milestones: Eloquent `HasMany` adapter with transactions and tenant scoping; JS virtualization; input components extended safely; keyboard reorder accessibility; general reactive field/server fallback; benchmark suite versus native `Repeater`.

## License

MIT. Not affiliated with the Filament framework maintainers.
