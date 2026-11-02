<?php

declare(strict_types=1);

namespace FnxSoftware\FNXRepeater\Support;

use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\Field;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use FnxSoftware\FNXRepeater\Forms\Components\FNXColumn;
use InvalidArgumentException;
use Throwable;

/**
 * Intentionally narrow: PHP schemas, callbacks, child actions, relationships,
 * remote select search and most field types cannot be executed in the browser.
 * Throw instead of silently losing user data or security rules.
 */
final class NativeFieldAdapter
{
    public static function convert(Field $field): FNXColumn
    {
        $type = $field::class;

        if (! in_array($type, [TextInput::class, Textarea::class, Select::class, Checkbox::class, Toggle::class], true)) {
            throw new InvalidArgumentException("Unsupported FNXRepeater field [{$type}]. Use FNXColumn or the native Filament Repeater.");
        }

        try {
            $name = $field->getName();
            $label = $field->getLabel();
            $column = FNXColumn::make($name)
                ->label(is_string($label) ? $label : ucwords(str_replace('_', ' ', $name)))
                ->required($field->isRequired())
                ->default($field->getDefaultState());

            if (method_exists($field, 'getPlaceholder')) {
                $column->placeholder($field->getPlaceholder());
            }

            if ($field instanceof TextInput) {
                if ($field->isNumeric()) {
                    $column->number();
                    if ($field->getMinValue() !== null) {
                        $column->min((float) $field->getMinValue());
                    }
                    if ($field->getMaxValue() !== null) {
                        $column->max((float) $field->getMaxValue());
                    }
                } elseif ($field->isEmail()) {
                    $column->email();
                }
            } elseif ($field instanceof Textarea) {
                $column->textarea();
            } elseif ($field instanceof Select) {
                if ($field->isMultiple() || $field->hasDynamicOptions()) {
                    throw new InvalidArgumentException("FNXRepeater requires static, single-value Select options for [{$name}].");
                }
                $column->select($field->getOptions());
            } elseif ($field instanceof Checkbox || $field instanceof Toggle) {
                $default = $field->getDefaultState();
                $column->checkbox()->default($default ?? false);
            }

            if (method_exists($field, 'getMaxLength') && $field->getMaxLength() !== null) {
                $column->maxLength((int) $field->getMaxLength());
            }

            if (method_exists($field, 'isReadOnly')) {
                $column->readOnly($field->isReadOnly());
            }

            if ($field->isDisabled()) {
                $column->readOnly();
            }

            return $column;
        } catch (InvalidArgumentException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw new InvalidArgumentException(
                "FNXRepeater cannot serialize dynamic configuration for [{$type}]: {$exception->getMessage()}",
                previous: $exception,
            );
        }
    }
}
