<?php

declare(strict_types=1);

require __DIR__ . '/../../src/Forms/Components/FNXColumn.php';

use FnxSoftware\FNXRepeater\Forms\Components\FNXColumn;

$column = FNXColumn::make('amount')
    ->label('Amount')
    ->number()
    ->min(0)
    ->default(15);

assert($column->getName() === 'amount');
assert($column->toArray()['type'] === 'number');
assert($column->toArray()['min'] === 0.0);
assert($column->toArray()['default'] === 15);

echo "FNXColumn smoke passed\n";
