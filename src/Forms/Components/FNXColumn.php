<?php

declare(strict_types=1);

namespace FnxSoftware\FNXRepeater\Forms\Components;

use InvalidArgumentException;

/**
 * Serializable column definition. A native Filament field may also be used via
 * FNXRepeater::schema() when its configuration is purely static/client-safe.
 */
final class FNXColumn
{
    private string $type = 'text';

    private ?string $label = null;

    private ?string $placeholder = null;

    private bool $required = false;

    private bool $readOnly = false;

    private mixed $default = null;

    private ?float $min = null;

    private ?float $max = null;

    private ?float $step = null;

    private ?int $maxLength = 255;

    /** @var array<string, string> */
    private array $options = [];

    private function __construct(private readonly string $name)
    {
        if (! preg_match('/^[a-zA-Z][a-zA-Z0-9_]*$/D', $name)) {
            throw new InvalidArgumentException('FNXColumn names must be ASCII identifiers, starting with a letter.');
        }
    }

    public static function make(string $name): self
    {
        return new self($name);
    }

    public function label(string $value): self
    {
        $this->label = $value;

        return $this;
    }

    public function text(): self
    {
        $this->type = 'text';

        return $this;
    }

    public function number(): self
    {
        $this->type = 'number';
        $this->maxLength = null;

        return $this;
    }

    public function email(): self
    {
        $this->type = 'email';

        return $this;
    }

    public function textarea(): self
    {
        $this->type = 'textarea';

        return $this;
    }

    public function select(array $options): self
    {
        $this->type = 'select';
        $normalized = [];

        foreach ($options as $key => $label) {
            if (! is_string($label) && ! is_numeric($label)) {
                throw new InvalidArgumentException('FNXRepeater supports flat scalar select labels only.');
            }

            $normalized[(string) $key] = (string) $label;
        }

        $this->options = $normalized;
        $this->maxLength = null;

        return $this;
    }

    public function checkbox(): self
    {
        $this->type = 'checkbox';
        $this->maxLength = null;
        $this->default = false;

        return $this;
    }

    public function placeholder(?string $placeholder): self
    {
        $this->placeholder = $placeholder;

        return $this;
    }

    public function required(bool $required = true): self
    {
        $this->required = $required;

        return $this;
    }

    public function readOnly(bool $readOnly = true): self
    {
        $this->readOnly = $readOnly;

        return $this;
    }

    public function default(mixed $default): self
    {
        if (! is_null($default) && ! is_scalar($default)) {
            throw new InvalidArgumentException('FNXColumn default must be a scalar or null.');
        }

        $this->default = $default;

        return $this;
    }

    public function min(float $value): self
    {
        $this->min = $value;

        return $this;
    }

    public function max(float $value): self
    {
        $this->max = $value;

        return $this;
    }

    public function step(float $value): self
    {
        if ($value <= 0) {
            throw new InvalidArgumentException('Step must be positive.');
        }

        $this->step = $value;

        return $this;
    }

    public function maxLength(int $length): self
    {
        if ($length < 1) {
            throw new InvalidArgumentException('maxLength must be positive.');
        }

        $this->maxLength = $length;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'label' => $this->label ?? ucwords(str_replace('_', ' ', $this->name)),
            'type' => $this->type,
            'placeholder' => $this->placeholder,
            'required' => $this->required,
            'readOnly' => $this->readOnly,
            'default' => $this->default,
            'min' => $this->min,
            'max' => $this->max,
            'step' => $this->step,
            'maxLength' => $this->maxLength,
            'options' => $this->options,
        ];
    }
}
