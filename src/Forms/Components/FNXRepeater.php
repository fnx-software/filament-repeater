<?php

declare(strict_types=1);

namespace FnxSoftware\FNXRepeater\Forms\Components;

use Closure;
use Filament\Forms\Components\Concerns\HasJsRenderer;
use Filament\Forms\Components\Field;
use Filament\Schemas\Schema;
use Filament\Support\Facades\FilamentAsset;
use FnxSoftware\FNXRepeater\Rules\ValidFNXRepeater;
use FnxSoftware\FNXRepeater\Support\NativeFieldAdapter;
use InvalidArgumentException;

/**
 * Client-driven JSON repeater with a Filament-style card interface.
 * This is deliberately NOT a subclass of native Repeater: doing so would
 * produce a server-rendered child Schema per row and defeat the optimization.
 */
final class FNXRepeater extends Field
{
    use HasJsRenderer;

    /** @var array<Field|FNXColumn> */
    protected array $fnxSchema = [];

    protected int | Closure $pageSize = 25;
    protected int | Closure $minItems = 0;
    protected int | Closure $maxItems = 2000;
    protected int | Closure $gridColumnCount = 2;
    protected bool | Closure $canAdd = true;
    protected bool | Closure $canDelete = true;
    protected bool | Closure $canClone = true;
    protected bool | Closure $canReorder = true;
    protected bool | Closure $canDrag = true;
    protected bool | Closure $canMoveButtons = true;
    protected bool | Closure $canCollapse = true;
    protected bool | Closure $initiallyCollapsed = false;
    protected bool | Closure $showItemNumbers = true;
    protected string | Closure | null $itemLabelColumn = null;
    protected string | Closure | null $addButtonLabel = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->default([]);
        $this->required(fn (): bool => $this->getMinItems() > 0);
        $this->rules([
            fn (): ValidFNXRepeater => new ValidFNXRepeater(
                $this->getColumns(),
                $this->getMinItems(),
                $this->getMaxItems(),
            ),
        ]);
    }

    /**
     * Same basic entry point as Repeater::schema() for static supported fields.
     * We intentionally do not call parent::schema(), avoiding server-side child schemas.
     *
     * @param array<Field|FNXColumn>|Schema|Closure $components
     */
    public function schema(array | Schema | Closure $components): static
    {
        if (! is_array($components)) {
            throw new InvalidArgumentException('FNXRepeater::schema() requires a static array of supported fields. Dynamic PHP schemas are not browser-executable.');
        }

        $this->fnxSchema = array_values($components);
        $this->getColumns(); // fail fast on unsupported components

        return $this;
    }

    /** @return array<FNXColumn> */
    public function getColumns(): array
    {
        if ($this->fnxSchema === []) {
            throw new InvalidArgumentException('FNXRepeater requires schema([...]) with at least one supported field.');
        }

        $columns = array_map(static function (mixed $entry): FNXColumn {
            if ($entry instanceof FNXColumn) return $entry;
            if ($entry instanceof Field) return NativeFieldAdapter::convert($entry);
            throw new InvalidArgumentException('FNXRepeater::schema() accepts only FNXColumn or supported Filament Field objects.');
        }, $this->fnxSchema);

        $names = array_map(static fn (FNXColumn $column): string => $column->getName(), $columns);
        if (count($names) !== count(array_unique($names))) {
            throw new InvalidArgumentException('FNXRepeater field names must be unique.');
        }

        return $columns;
    }

    public function gridColumns(int | Closure $columns): static
    {
        $this->gridColumnCount = $columns;

        return $this;
    }
    public function pageSize(int | Closure $value): static
    {
        $this->pageSize = $value;

        return $this;
    }
    public function minItems(int | Closure $value): static
    {
        $this->minItems = $value;

        return $this;
    }
    public function maxItems(int | Closure $value): static
    {
        $this->maxItems = $value;

        return $this;
    }
    public function addable(bool | Closure $value = true): static
    {
        $this->canAdd = $value;

        return $this;
    }
    public function deletable(bool | Closure $value = true): static
    {
        $this->canDelete = $value;

        return $this;
    }
    public function cloneable(bool | Closure $value = true): static
    {
        $this->canClone = $value;

        return $this;
    }
    public function reorderable(bool | Closure $value = true): static
    {
        $this->canReorder = $value;

        return $this;
    }
    public function reorderableWithDragAndDrop(bool | Closure $value = true): static
    {
        $this->canDrag = $value;

        return $this;
    }
    public function reorderableWithButtons(bool | Closure $value = true): static
    {
        $this->canMoveButtons = $value;

        return $this;
    }
    public function collapsible(bool | Closure $value = true): static
    {
        $this->canCollapse = $value;

        return $this;
    }
    public function collapsed(bool | Closure $value = true): static
    {
        $this->initiallyCollapsed = $value;

        return $this;
    }
    public function itemNumbers(bool | Closure $value = true): static
    {
        $this->showItemNumbers = $value;

        return $this;
    }
    public function itemLabelColumn(string | Closure | null $value): static
    {
        $this->itemLabelColumn = $value;

        return $this;
    }
    public function addActionLabel(string | Closure | null $value): static
    {
        $this->addButtonLabel = $value;

        return $this;
    }

    public function defaultItems(int $count): static
    {
        if ($count < 0 || $count > 1000) {
            throw new InvalidArgumentException('defaultItems must be between 0 and 1000.');
        }

        $this->default(fn (): array => array_fill(0, $count, $this->getBlankRow()));

        return $this;
    }

    /** @return array<string, mixed> */
    protected function getBlankRow(): array
    {
        $result = [];
        foreach ($this->getColumns() as $column) {
            $config = $column->toArray();
            $result[$config['name']] = $config['default'];
        }

        return $result;
    }

    public function getMinItems(): int
    {
        return min(10000, max(0, (int) $this->evaluate($this->minItems)));
    }
    public function getMaxItems(): int
    {
        return min(10000, max($this->getMinItems(), (int) $this->evaluate($this->maxItems)));
    }

    public function getRenderer(): string
    {
        return FilamentAsset::getScriptSrc('fnx-repeater', 'fnx-software/filament-repeater');
    }

    /** @return array<string, mixed> */
    public function getRendererConfiguration(): array
    {
        return [
            'columns' => array_map(static fn (FNXColumn $column): array => $column->toArray(), $this->getColumns()),
            'pageSize' => min(100, max(5, (int) $this->evaluate($this->pageSize))),
            'minItems' => $this->getMinItems(),
            'maxItems' => $this->getMaxItems(),
            'gridColumns' => min(4, max(1, (int) $this->evaluate($this->gridColumnCount))),
            'addable' => (bool) $this->evaluate($this->canAdd),
            'deletable' => (bool) $this->evaluate($this->canDelete),
            'duplicable' => (bool) $this->evaluate($this->canClone),
            'reorderable' => (bool) $this->evaluate($this->canReorder),
            'draggable' => (bool) $this->evaluate($this->canDrag),
            'moveButtons' => (bool) $this->evaluate($this->canMoveButtons),
            'collapsible' => (bool) $this->evaluate($this->canCollapse),
            'collapsed' => (bool) $this->evaluate($this->initiallyCollapsed),
            'itemNumbers' => (bool) $this->evaluate($this->showItemNumbers),
            'itemLabelColumn' => $this->evaluate($this->itemLabelColumn),
            'addLabel' => $this->evaluate($this->addButtonLabel),
            'labels' => [
                'add' => __('fnx-repeater::fnx-repeater.add'),
                'empty' => __('fnx-repeater::fnx-repeater.empty'),
                'items' => __('fnx-repeater::fnx-repeater.items'),
                'duplicate' => __('fnx-repeater::fnx-repeater.duplicate'),
                'undo' => __('fnx-repeater::fnx-repeater.undo'),
                'delete' => __('fnx-repeater::fnx-repeater.delete'),
                'moveUp' => __('fnx-repeater::fnx-repeater.move_up'),
                'moveDown' => __('fnx-repeater::fnx-repeater.move_down'),
                'drag' => __('fnx-repeater::fnx-repeater.drag'),
                'previous' => __('fnx-repeater::fnx-repeater.previous'),
                'next' => __('fnx-repeater::fnx-repeater.next'),
                'page' => __('fnx-repeater::fnx-repeater.page'),
                'showing' => __('fnx-repeater::fnx-repeater.showing'),
                'of' => __('fnx-repeater::fnx-repeater.of'),
                'rowsPerPage' => __('fnx-repeater::fnx-repeater.rows_per_page'),
                'maxReached' => __('fnx-repeater::fnx-repeater.max_reached'),
                'minReached' => __('fnx-repeater::fnx-repeater.min_reached'),
                'actions' => __('fnx-repeater::fnx-repeater.actions'),
                'collapse' => __('fnx-repeater::fnx-repeater.collapse'),
                'expand' => __('fnx-repeater::fnx-repeater.expand'),
                'collapseAll' => __('fnx-repeater::fnx-repeater.collapse_all'),
                'expandAll' => __('fnx-repeater::fnx-repeater.expand_all'),
                'item' => __('fnx-repeater::fnx-repeater.item'),
            ],
        ];
    }
}
