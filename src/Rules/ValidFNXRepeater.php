<?php

declare(strict_types=1);

namespace FnxSoftware\FilamentClientRepeater\Rules;

use Closure;
use FnxSoftware\FNXRepeater\Forms\Components\FNXColumn;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Validate the JSON-array field itself, before it is persisted.
 * It does not authorize relationship IDs or perform tenant scoping.
 */
final class ValidFNXRepeater implements ValidationRule
{
    /** @param array<FNXColumn> $columns */
    public function __construct(
        private readonly array $columns,
        private readonly int $minItems,
        private readonly int $maxItems,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value) || ! array_is_list($value)) {
            $fail('The :attribute must be a list of rows.');

            return;
        }

        if (count($value) < $this->minItems || count($value) > $this->maxItems) {
            $fail("The :attribute must contain between {$this->minItems} and {$this->maxItems} rows.");

            return;
        }

        $names = array_map(static fn (FNXColumn $column): string => $column->getName(), $this->columns);
        $rules = [];
        $data = ['rows' => $value];

        foreach ($value as $index => $row) {
            if (! is_array($row) || array_is_list($row) && $row !== []) {
                $fail('Every row must be an object with named column keys.');

                return;
            }

            $unknown = array_diff(array_keys($row), $names);

            if ($unknown !== []) {
                // Prevent client-submitted owner_id, role, tenant_id, etc.
                $fail('A row contains an unrecognized column.');

                return;
            }
        }

        foreach ($this->columns as $column) {
            $config = $column->toArray();
            $rulesForColumn = [$config['required'] ? 'required' : 'nullable'];

            if ($config['type'] === 'number') {
                $rulesForColumn[] = 'numeric';

                if ($config['min'] !== null) {
                    $rulesForColumn[] = 'min:' . $config['min'];
                }

                if ($config['max'] !== null) {
                    $rulesForColumn[] = 'max:' . $config['max'];
                }
            } elseif ($config['type'] === 'checkbox') {
                $rulesForColumn[] = 'boolean';
            } else {
                $rulesForColumn[] = 'string';

                if ($config['maxLength'] !== null) {
                    $rulesForColumn[] = 'max:' . $config['maxLength'];
                }

                if ($config['type'] === 'select') {
                    $rulesForColumn[] = Rule::in(array_keys($config['options']));
                }
            }

            $rules['rows.*.' . $column->getName()] = $rulesForColumn;
        }

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            // One concise field-level error; all row values stay intact.
            $fail($validator->errors()->first());
        }
    }
}
